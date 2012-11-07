(ns webgl.presenters.editor
  (:require [webgl.models.menu              :as men]
            [webgl.models.operators         :as ops]
            [webgl.models.operators.factory :as ops.factory]
            [webgl.models.selection         :as sel.model]
            [webgl.presenters.selection     :as sel]
            [webgl.views.tree               :as tree]
            [webgl.kit.behaviours           :as b]
            [webgl.kit.rx                   :as rx]
            [webgl.partials.key             :as key])
  (:require-macros [webgl.kit.rx.macros     :as rxm]))

(def display ::display)

(def selected   ::operator-selected)
(def deselected ::operator-deselected)
(def assigned   ::operator-assigned)

(defrecord Presenter
  [model menu selector events])

(defn is? [f value]
  #(= (f %) value))

(extend-protocol tree/Node
  ops/Operator
  (id [op]
    (str (ops/id op)))
  (label [op]
    (ops/label op))
  (children [op]
    (->> (ops/children op)
         (remove (is? ops/op-name :constant))
         (vec)))
  (style [op]
    (if (= (ops/op-name op) :unassigned)
      "unassigned"
      (name (ops/result-type op)))))

(defn- fire-operator [event events]
  (-> (rx/pipe)
      (rx/fire events event)))

(defn- raise-operator [view]
  #(tree/raise view %))

(defn- lower-operator [view]
  #(tree/lower view %))

(defn- assign-operator [presenter op type]
  (let [new (ops.factory/make type)]
    (ops/replace (:model presenter) op new)
    (rx/named-event (:events presenter) assigned new)))

(defmulti operator->menu
  (fn [presenter op]
    (ops/op-name op)))

(defmethod operator->menu :default [presenter op])

(defmethod operator->menu :unassigned [presenter op]
  (apply men/root
    (map-indexed
      (fn [i type]
        (men/command
          (:label type)
          (+ 68 i)
          #(assign-operator presenter op (:name type))))
      (ops/discover-by
        :result-type :geometry
        (is? ops/unassigned-count 0)))))

(defmethod operator->menu :default [presenter op]
  (men/root
    (men/command
      "Render" 82
      #(rx/named-event (:events presenter) display op))
    (men/command
     "Revolution" 83
     (comp
       #(ops/transform (:model presenter) op %)
       #(ops.factory/make :revolution-solid)))))

(defn- set-operator-menu [presenter]
  #(men/set! (:menu presenter)
     (operator->menu presenter %)))

(defn- handle-operator-selection [presenter view]
  (rx/do
    (raise-operator view)
    (set-operator-menu presenter)))

(defn- node-selection [view selection events]
  (let [selector (sel/present selection)]
    (rxm/on (:events selector)
      sel/selected   (fire-operator selected events)
      sel/deselected (fire-operator deselected events))
    selector))

(defn- register-view-events [view operator-selector events]
  (rxm/on (:events view)
    tree/node-clicked operator-selector))

(defn- register-model-events [model view]
  (rxm/on (:events model)
    ops/reload #(tree/set-root! view %)))

(defn- register-operator-events [presenter selector view]
  (rxm/on (:events presenter)
    selected   (handle-operator-selection presenter view)
    deselected (lower-operator view)
    assigned   selector))

(defn present [model menu-model view]
  (let [events    (rx/named-channels display selected deselected assigned)
        selection (atom nil)
        selector  (node-selection view selection events)
        presenter (Presenter. model menu-model selector events)]
    (register-model-events model view)
    (register-operator-events presenter selector view)
    (doto view
      (b/keep-resized)
      (register-view-events selector events))
    presenter))
