(ns webgl.core
  (:require [jayq.core                      :as jayq]
            [webgl.api                      :as api]
            [webgl.kit.rx                   :as rx]
            [webgl.presenters.editor        :as editor]
            [webgl.presenters.operator-tree :as renderer]
            [webgl.models.operators         :as model]
            [webgl.views.fatal              :as fatal]
            [webgl.views.gl                 :as display]
            [webgl.views.tree               :as tree]
            ;; development stuff
            [clojure.browser.repl :as repl])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(def test-data
  (model/Operator.
    "foo"
    (array (model/Operator. "bar" (array))
           (model/Operator. "baz" (array)))))

(defn- add-viewport [model]
  (renderer/present
    model
    (display/make (jayq/$ :#viewport))))

(defn- add-editor [model]
  (editor/present
    model
    (tree/make :#tree)))

(defn load []
  (.log js/console "Loading app...")
  (try
    (let [operators (model/make)
          viewport  (add-viewport operators)
          editor    (add-editor operators)]
      (rxm/on (:events editor)
        editor/display #(.log js/console "TEST"))
      ;; simulate a reload of the model
      (model/set! operators test-data))
    (catch js/Error e
      (->> (aget e "message")
           (fatal/make)
           (jayq/inner (jayq/$ :#wrapper)))
      (.log js/console (aget e "stack"))
      (throw e))))

(defn ^:export init []
;; (repl/connect "http://localhost:9000/repl")
  (jayq/document-ready load))
