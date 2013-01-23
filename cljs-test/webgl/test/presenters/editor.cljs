(ns webgl.test.presenters.editor
  (:require [webgl.kit.rx            :as rx]
            [webgl.models.operators  :as ops]
            [webgl.presenters.editor :as ed]
            [webgl.views.tree        :as tree])
  (:require-macros [webgl.jasmine       :as j]
                   [webgl.kit.rx.macros :as rxm]))

(defrecord Mock [events])

(defn mock [& events]
  (Mock. (apply rx/named-channels events)))

(j/describe "Reloading the model"
  (j/it "will reset the tree view"
    (let [reset-spy  (js/spyOn webgl.views.tree "set_root_BANG_")
          mock-view  (mock tree/node-clicked :keydown)
          mock-model (mock ops/reload ops/update ops/create)
          editor     (ed/present mock-model mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-model) ops/reload ::root)
      ;; the node should have been raised
      (j/expect reset-spy => (toHaveBeenCalledWith mock-view ::root)))))

(j/describe "Selecting an operator"
            
  (j/it "will raise the operator in the tree view"
    (let [raise-spy  (js/spyOn webgl.views.tree "raise")
          mock-view  (mock tree/node-clicked :keydown)
          editor     (ed/present (mock ops/reload ops/update ops/create) mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      ;; the node should have been raised
      (j/expect raise-spy => (toHaveBeenCalledWith mock-view ::node))))
  
  (j/it "will do nothing when clicking the same operator twice"
    (let [raise-spy (js/spyOn webgl.views.tree "raise")
          mock-view (mock tree/node-clicked :keydown)
          editor    (ed/present (mock ops/reload ops/update ops/create) mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      ;; the node should have been raised
      (j/expect (.-callCount raise-spy) => (toEqual 1))))
  
  (j/it "will lower the previous selection when clicking another operator"
    (let [raise-spy (js/spyOn webgl.views.tree "raise")
          lower-spy (js/spyOn webgl.views.tree "lower")
          mock-view (mock tree/node-clicked :keydown)
          editor    (ed/present (mock ops/reload ops/update ops/create) mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      (rx/named-event (:events mock-view) tree/node-clicked ::another-node)
      ;; the node should have been raised
      (j/expect lower-spy => (toHaveBeenCalledWith mock-view ::node))))

  (j/it "will raise the new operator when switching selections"
    (let [raise-spy (js/spyOn webgl.views.tree "raise")
          lower-spy (js/spyOn webgl.views.tree "lower")
          mock-view (mock tree/node-clicked :keydown)
          editor    (ed/present (mock ops/reload ops/update ops/create) mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      (rx/named-event (:events mock-view) tree/node-clicked ::another-node)
      ;; the node should have been raised
      (j/expect raise-spy => (toHaveBeenCalledWith mock-view ::node)))))
