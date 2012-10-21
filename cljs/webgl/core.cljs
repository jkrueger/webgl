(ns webgl.core
  (:require [jayq.core                      :as jayq]
            [webgl.geometry                 :as geo]
            [webgl.kit.rx                   :as rx]
            [webgl.presenters.editor        :as editor]
            [webgl.presenters.help          :as help]
            [webgl.presenters.properties    :as props]
            [webgl.presenters.operator-tree :as viewport]
            [webgl.models.operators         :as model]
            [webgl.models.operators.factory :as model.factory]
            [webgl.views.fatal              :as fatal]
            [webgl.views.gl                 :as gl]
            [webgl.views.form               :as form]
            [webgl.views.tree               :as tree]
            ;; development stuff
            [clojure.browser.repl :as repl])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(def test-data
  (doto (model.factory/make :transform)
    (model/set-input 0
      (model.factory/make :triangle))))

(defn- add-viewport [model]
  (viewport/present
    model
    (gl/make :#viewport)))

(defn- add-properties [model]
  (props/present
    model
    (form/make "#properties > div")))

(defn- add-editor [model]
  (editor/present
    model
    (tree/make "#tree > div")))

(defn- add-help []
  (help/present "#help div.text"))

(defn- display-operator [renderer]
  #(viewport/display renderer %))

(defn- show-operator-properties [properties]
  #(props/show-operator properties %))

(defn- register-editor-events [editor renderer properties]
  ;; events on the editor itself
  (rxm/on (:events editor)
    editor/display           (display-operator renderer)
    editor/operator-selected (show-operator-properties properties)))

(defn register-help-events [editor help]
  (rxm/on (:events editor)
    editor/display           #(help/transition help :display)
    editor/operator-selected #(help/transition help :selected)))

(defn load []
  (.log js/console "Loading app...")
  (try
    (let [operators  (model/make)
          renderer   (add-viewport operators)
          properties (add-properties operators)
          editor     (add-editor operators)
          help       (add-help)]
      (register-editor-events
        editor renderer properties)
      (register-help-events
        editor help)
      ;; simulate a reload of the model
      (model/set! operators test-data))
    (catch js/Error e
      ;; (->> (aget e "message")
      ;;      (fatal/make)
      ;;      (jayq/inner (jayq/$ :#wrapper)))
      (.log js/console (aget e "stack"))
      (throw e))))

(defn ^:export init []
  ;; (repl/connect "http://localhost:9000/repl")
  (set! *print-fn* #(.log js/console %))
  (jayq/document-ready load))
