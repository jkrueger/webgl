(ns webgl.core
  (:require [jayq.core                      :as jayq]
            [webgl.api                      :as api]
            [webgl.presenters.editor        :as editor]
            [webgl.presenters.operator-tree :as renderer]
            [webgl.models.operators         :as model]
            [webgl.views.fatal              :as fatal]
            [webgl.views.gl                 :as display]
            [webgl.views.tree               :as tree]
            ;; development stuff
            [clojure.browser.repl :as repl]))

(defn load []
  (.log js/console "Loading app...")
  (try
    (let [model (model/make)]
      (renderer/present
        model
        (display/make (jayq/$ :#viewport)))
      (editor/present
        model
        (tree/make :#tree)))
    (catch js/Error e
      (->> (aget e "message")
           (fatal/make)
           (jayq/inner (jayq/$ :#wrapper)))
      (throw e))))

(defn ^:export init []
;; (repl/connect "http://localhost:9000/repl")
  (jayq/document-ready load))
