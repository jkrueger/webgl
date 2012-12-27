(ns webgl.core
  (:require [jayq.core                      :as jayq]
            [webgl.geometry                 :as geo]
            [webgl.kit.d3                   :as d3]
            [webgl.kit.d3.fx                :as fx]
            [webgl.kit.rx                   :as rx]
            [webgl.presenters.editor        :as editor]
            [webgl.presenters.help          :as help]
            [webgl.presenters.menu          :as menu.presenter]
            [webgl.presenters.properties    :as props]
            [webgl.presenters.operator-tree :as viewport]
            [webgl.models.menu              :as men]
            [webgl.models.menu.operators    :as men.ops]
            [webgl.models.operators         :as model]
            [webgl.models.operators.factory :as model.factory]
            [webgl.views.fatal              :as fatal]
            [webgl.views.form               :as form]
            [webgl.views.gl                 :as gl]
            [webgl.views.help               :as help.view]
            [webgl.views.list               :as list.view]
            [webgl.views.tree               :as tree]
            ;; development stuff
            [clojure.browser.repl :as repl])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(defmulti static-entries
  (fn [op]
    (model/result-type op)))

(defmethod static-entries :default
  [_]
  [])

(defn- add-viewport [model]
  (viewport/present
    model
    (gl/make :#viewport)))

(defn- add-properties [model]
  (props/present
    model
    (form/make "#properties > div.content"
      "This operator has no configurable properties")))

(defn- add-editor [model]
  (editor/present
    model
    (tree/make "#tree > div")))

(defn- add-help []
  (help/present (help.view/make "#help div.content div.help")))

(defn- add-menu [operators]
  (menu.presenter/present
    (men.ops/make (men/make) operators static-entries)
    (list.view/make "#help div.content div.menu")))

(defn- show-operator-properties [properties]
  #(props/show-operator properties %))

(defn- update-menu [menu]
  #(menu.presenter/set! menu %))

(defn- register-editor-events [editor renderer properties menu]
  ;; events on the editor itself
  (rxm/on (:events editor)
    editor/selected
      (rx/do
        (show-operator-properties properties)
        (update-menu menu))))

(defn- register-help-events [editor help]
  (rxm/on (:events editor)
    ;;editor/display  #(help/transition help :display)
    editor/selected #(help/transition help :selected)
    ;;editor/assigned #(help/transition help :assigned)
    ))

(defn- handle-menu-key [menu]
  (fn [evt]
    (when (= (.-which evt) 17)
      (-> (d3/select "#help div.help")
          (fx/fade-out))
      (-> (d3/select "#help div.menu")
          (fx/fade-in)
          (fx/scale-in)))
    (if (.-ctrlKey evt)
      (men/select (:model menu) (.-which evt))
      (men/leave  (:model menu)))))

(defn hide-menu [menu]
  (fn [evt]
    (when (= (.-which evt) 17)
      (-> (d3/select "#help div.help")
          (fx/fade-in))
      (-> (d3/select "#help div.menu")
          (fx/fade-out)
          (fx/scale-out)))))

(defn- register-menu-events [menu]
  (-> (rx/event-source :keydown js/window)
      (rx/observe (handle-menu-key menu)))
  (-> (rx/event-source :keyup js/window)
      (rx/observe (hide-menu menu))))

(defn register-static-menu-entries [renderer]
  (defmethod static-entries :geometry [op]
    [(men/command
      "Render" 82
      #(viewport/display renderer op))]))

(defn load []
  (.log js/console "Loading app...")
  (try
    (let [operators  (model/make)
          renderer   (add-viewport operators)
          properties (add-properties operators)
          editor     (add-editor operators)
          help       (add-help)
          menu-help  (add-menu operators)]
      (register-editor-events
        editor renderer properties menu-help)
      (register-help-events
        editor help)
      (register-menu-events menu-help)
      (register-static-menu-entries renderer)
      ;; simulate a reload of the model
      (model/set-root! operators (model.factory/make :unassigned :geometry)))
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
