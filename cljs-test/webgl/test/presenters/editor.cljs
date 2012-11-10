(ns webgl.test.presenters.editor
  (:require [webgl.kit.rx            :as rx]
            [webgl.models.operators  :as ops]
            [webgl.models.menu       :as men]
            [webgl.presenters.editor :as ed]
            [webgl.views.tree        :as tree])
  (:require-macros [webgl.jasmine       :as j]
                   [webgl.kit.rx.macros :as rxm]))

(defrecord Mock [events])

(defn mock [& events]
  (Mock. (apply rx/named-channels events)))

(def mock-menu (mock men/reload))

(j/describe "Reloading the model"
  (j/it "will reset the tree view"
    (let [reset-spy  (js/spyOn webgl.views.tree "set_root_BANG_")
          mock-view  (mock tree/node-clicked :keydown)
          mock-model (mock ops/reload)
          editor     (ed/present mock-model mock-menu mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-model) ops/reload ::root)
      ;; the node should have been raised
      (j/expect reset-spy => (toHaveBeenCalledWith mock-view ::root)))))

(j/describe "Selecting an operator"
            
  (j/it "will raise the operator in the tree view"
    (let [raise-spy  (js/spyOn webgl.views.tree "raise")
          menu-spy   (js/spyOn webgl.presenters.editor "operator__GT_menu")
          menu2-spy  (js/spyOn webgl.models.menu "set_BANG_")
          mock-view  (mock tree/node-clicked :keydown)
          editor     (ed/present (mock ops/reload) mock-menu mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      ;; the node should have been raised
      (j/expect raise-spy => (toHaveBeenCalledWith mock-view ::node))))
  
  (j/it "will do nothing when clicking the same operator twice"
    (let [raise-spy (js/spyOn webgl.views.tree "raise")
          menu-spy  (js/spyOn webgl.presenters.editor "operator__GT_menu")
          menu2-spy (js/spyOn webgl.models.menu "set_BANG_")
          mock-view (mock tree/node-clicked :keydown)
          editor    (ed/present (mock ops/reload) mock-menu mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      ;; the node should have been raised
      (j/expect (.-callCount raise-spy) => (toEqual 1))))
  
  (j/it "will lower the previous selection when clicking another operator"
    (let [raise-spy (js/spyOn webgl.views.tree "raise")
          lower-spy (js/spyOn webgl.views.tree "lower")
          menu-spy  (js/spyOn webgl.presenters.editor "operator__GT_menu")
          menu2-spy (js/spyOn webgl.models.menu "set_BANG_")
          mock-view (mock tree/node-clicked :keydown)
          editor    (ed/present (mock ops/reload) mock-menu mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      (rx/named-event (:events mock-view) tree/node-clicked ::another-node)
      ;; the node should have been raised
      (j/expect lower-spy => (toHaveBeenCalledWith mock-view ::node))))

  (j/it "will raise the new operator when switching selections"
    (let [raise-spy (js/spyOn webgl.views.tree "raise")
          lower-spy (js/spyOn webgl.views.tree "lower")
          menu-spy  (js/spyOn webgl.presenters.editor "operator__GT_menu")
          menu2-spy (js/spyOn webgl.models.menu "set_BANG_")
          mock-view (mock tree/node-clicked :keydown)
          editor    (ed/present (mock ops/reload) mock-menu mock-view)]
      ;; generate click event
      (rx/named-event (:events mock-view) tree/node-clicked ::node)
      (rx/named-event (:events mock-view) tree/node-clicked ::another-node)
      ;; the node should have been raised
      (j/expect raise-spy => (toHaveBeenCalledWith mock-view ::node)))))
