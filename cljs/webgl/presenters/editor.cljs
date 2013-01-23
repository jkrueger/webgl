(ns webgl.presenters.editor
  (:require [webgl.models.operators         :as ops]
            [webgl.models.selection         :as sel.model]
            [webgl.presenters.selection     :as sel]
            [webgl.views.tree               :as tree]
            [webgl.kit.behaviours           :as b]
            [webgl.kit.rx                   :as rx]
            [webgl.partials.key             :as key])
  (:require-macros [webgl.kit.rx.macros     :as rxm]))

(def selected   ::operator-selected)
(def deselected ::operator-deselected)

(defrecord Presenter
  [model view selector events])

(defn is? [f value]
  #(= (f %) value))

(extend-protocol tree/Wrap
  ops/Operator
  (wrap [o]
    (tree/NodeWrapper. o)))

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

(defn- node-selection [view selection events]
  (let [selector (sel/present selection)]
    (rxm/on (:events selector)
      sel/selected   (fire-operator selected events)
      sel/deselected (fire-operator deselected events))
    selector))

(defn- register-view-events [view operator-selector events]
  (rxm/on (:events view)
    tree/node-clicked operator-selector))

(defn- register-model-events [presenter]
  (let [model           (:model presenter)
        view            (:view presenter)
        select-operator (:selector presenter)]
    (rxm/on (:events model)
      ops/reload #(tree/set-root! view %)
      ops/update #(tree/layout view)
      ops/create select-operator)))

(defn- register-operator-events [presenter]
  (let [view (:view presenter)]
    (rxm/on (:events presenter)
      selected    (raise-operator view)
      deselected  (lower-operator view))))

(defn- make-channels []
  (rx/named-channels
    selected
    deselected))

(defn present [model view]
  (let [events    (make-channels)
        selection (atom nil)
        selector  (node-selection view selection events)
        presenter (Presenter. model view selector events)]
    (register-model-events presenter)
    (register-operator-events presenter)
    (doto view
      (b/keep-resized)
      (register-view-events selector events))
    presenter))
