(ns webgl.presenters.editor
  (:require [webgl.models.operators     :as ops]
            [webgl.presenters.selection :as sel]
            [webgl.views.tree           :as tree]
            [webgl.kit.behaviours       :as b]
            [webgl.kit.rx               :as rx])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(def display           ::display)
(def operator-selected ::operator-selected)

(defrecord Presenter
  [events operator-selection])

(defn is? [f value]
  #(= (f %) value))

(extend-protocol tree/Node
  ops/Operator
  (label [op]
    (ops/label op))
  (children [op]
    (->> (ops/children op)
         (remove (is? ops/op-name :constant))
         (vec)))
  (style [op]
    (name (ops/result-type op))))

(defn- key? [s k]
  (rx/filter s #(= % k)))

(defn- selected? [s selector]
  (rx/when s #(sel/selected? selector)))

(defn- to-selection [s selector]
  (-> (selected? s selector)
      (rx/map #(sel/current selector))
      (rx/map tree/node-data)))

(defn- fire-display [selector events]
  (-> (rx/pipe)
      (key? 82)
      (to-selection selector)
      (rx/fire events display)))

(defn- fire-operator-selected [events]
  (-> (rx/pipe)
      (rx/map tree/node-data)
      (rx/fire events operator-selected)))

(defn- raise-operator [view]
  #(tree/raise view %))

(defn- lower-operator [view]
  #(tree/lower view %))

(defn- handle-operator-selection [view events]
  (rx/do
    (raise-operator view)
    (fire-operator-selected events)))

(defn- node-selection [view events]
  (let [selector (sel/present (atom nil))]
    (rxm/on (:events selector)
      sel/selected   (handle-operator-selection view events)
      sel/deselected (lower-operator view))
    selector))

(defn- register-view-events [view operator-selector events]
  (rxm/on (:events view)
    tree/node-clicked operator-selector
    :keydown          (fire-display operator-selector events)))

(defn- register-model-events [model view]
  (rxm/on (:events model)
    ops/reload #(tree/set-root! view %)))

(defn present [model view]
  (let [events (rx/named-channels display operator-selected)]
    (register-model-events model view)
    (doto view
      (b/keep-resized)
      (register-view-events
        (node-selection view events)
        events))
    (Presenter. events)))
