(ns webgl.core
  (:require [jayq.core                      :as jayq]
            [webgl.geometry                 :as geo]
            [webgl.kit.d3                   :as d3]
            [webgl.kit.rx                   :as rx]
            [webgl.presenters.editor        :as editor]
            [webgl.presenters.help          :as help]
            [webgl.presenters.menu          :as menu.presenter]
            [webgl.presenters.properties    :as props]
            [webgl.presenters.operator-tree :as viewport]
            [webgl.models.menu              :as men]
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

(defn- add-viewport [model]
  (viewport/present
    model
    (gl/make :#viewport)))

(defn- add-properties [model]
  (props/present
    model
    (form/make "#properties > div"
      "This operator has no configurable properties")))

(defn- add-editor [model menu]
  (editor/present
    model menu
    (tree/make "#tree > div")))

(defn- add-help [menu]
  (help/present menu (help.view/make "#help div.content div.help")))

(defn- add-menu [menu]
  (menu.presenter/present menu (list.view/make "#help div.content div.menu")))

(defn- display-operator [renderer]
  #(viewport/display renderer %))

(defn- show-operator-properties [properties]
  #(props/show-operator properties %))

(defn- register-editor-events [editor renderer properties]
  ;; events on the editor itself
  (rxm/on (:events editor)
    editor/display  (display-operator renderer)
    editor/selected (show-operator-properties properties)))

(defn- register-help-events [editor help]
  (rxm/on (:events editor)
    editor/display  #(help/transition help :display)
    editor/selected #(help/transition help :selected)
    editor/assigned #(help/transition help :assigned)))

(defn- fade [value selection]
  (-> selection
      (d3/transition)
      (d3/css :opacity value)))

(def fade-in  (partial fade 1.0))
(def fade-out (partial fade 0.0))

(defn- scale [value transition]
  (-> transition
      (d3/css :-webkit-transform (str "scale(" value ")"))))

(def scale-in  (partial scale 1.0))
(def scale-out (partial scale 0.6))

(defn- handle-menu-key [menu]
  (fn [evt]
    (when (= (.-which evt) 18)
      (-> (d3/select "#help div.help")
          (fade-out))
      (-> (d3/select "#help div.menu")
          (fade-in)
          (scale-in)))
    (if (.-altKey evt)
      (men/select (:model menu) (.-which evt))
      (men/leave  (:model menu)))))

(defn hide-menu [menu]
  (fn [evt]
    (when (= (.-which evt) 18)
      (-> (d3/select "#help div.help")
          (fade-in))
      (-> (d3/select "#help div.menu")
          (fade-out)
          (scale-out)))))

(defn- register-menu-events [menu]
  (-> (rx/event-source :keydown js/window)
      (rx/observe (handle-menu-key menu)))
  (-> (rx/event-source :keyup js/window)
      (rx/observe (hide-menu menu))))

(defn load []
  (.log js/console "Loading app...")
  (try
    (let [operators  (model/make)
          menu       (men/make)
          renderer   (add-viewport operators)
          properties (add-properties operators)
          editor     (add-editor operators menu)
          help       (add-help menu)
          menu-help  (add-menu menu)]
      (register-editor-events
        editor renderer properties)
      (register-help-events
        editor help)
      (register-menu-events menu-help)
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
