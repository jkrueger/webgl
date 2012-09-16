(ns webgl.presenters.editor
  (:require [webgl.models.operators     :as ops]
            [webgl.models.selection     :as sel-mod]
            [webgl.presenters.selection :as sel]
            [webgl.views.tree           :as tree]
            [webgl.kit.behaviours       :as b]
            [webgl.kit.rx               :as rx])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(def display ::display)

(defrecord Presenter [events])

(defn- key? [s k]
  (rx/filter s #(= % k)))

(defn- selected? [s selection]
  (rx/when s #(sel-mod/selected? selection selection)))

(defn- to-selection [s selection]
  (-> (selected? s selection)
      (rx/map #(sel-mod/current selection))))

(defn- fire-display [selection events]
  (-> (rx/pipe)
      (key? 82)
      (to-selection selection)
      (rx/fire events display)))

(defn- node-selection [view model]
  (sel/present model view
    :on-select   tree/raise
    :on-deselect tree/lower))

(defn- register-view-events [view model events]
  (let [selection-model (atom nil)]
    (rxm/on (:events view)
      tree/node-clicked (node-selection view selection-model)
      :keydown          (fire-display selection-model events))))

(defn- register-model-events [model view]
  (rxm/on (:events model)
    ops/reload #(tree/set-root! view %)))

(defn present [model view]
  (let [events (rx/named-channels ::display)]
    (register-model-events model view)
    (doto view
      (b/keep-resized)
      (register-view-events model events))
    (Presenter. events)))
