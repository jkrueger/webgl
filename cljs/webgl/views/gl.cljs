(ns webgl.views.gl
  (:require [crate.core   :as crate]
            [jayq.core    :as jayq]
            [webgl.api    :as api]
            [webgl.kit.rx :as rx])
  (:require-macros [crate.def-macros :as c]))

(defrecord View [dom context paused frames])

(c/defpartial canvas [$container]
  [:canvas {:width (.width $container) :height (.height $container)}])

(declare resize-to-container)

(defn make [$container]
  (let [dom     (canvas $container)
        context (js/WebGLUtils.setupWebGL dom)]
    (when-not context
      (throw (js/Error. "Your browser does not support webgl")))
    (-> $container
        (jayq/append dom)
        (resize-to-container dom))
    (View. dom
           context
           (atom false)
           (rx/channel))))

(declare frame)

(defn start
  "Should be called to start the render loop. Prior to
   a call to this function no rendering takes place"
  [view]
  (frame view))

(defn pause
  "Pause the rendering loop"
  [view]
  (reset! (:paused view) true))

(defn paused? [view]
  @(:paused view))

(defn resume
  "Resume a previously paused rendering loop"
  [view]
  (reset! (:paused view) false)
  (frame view))

(defn onto
  "Takes a function which may contain rendering calls.
   The rendering calls will be executed on this view, by
   dynamically bding its rendering context"
  [view f]
  (api/with-context (:context view) f view))

(defn- request-another-frame
  "This implements the recommended way of doing
   framed animation by requesting a redraw from the
   browser"
  [view f]
  (.requestAnimFrame js/window f (:dom view)))

(defn- render
  "Trigger the frame event so that clients can render
   the scene"
  [view]
  (rx/event (:frames view) 0)) ;; TODO: pass frame number

(defn- frame
  "Triggers a redraw and requests another frame from
   the browser"
  [view]
  (when-not (paused? view)
    (request-another-frame
      view
      (partial frame view))
    (onto view render)))

(defn- resize-to-container
  "Creates a new observer for the window object
   that is triggered on resize events and adjusts the
   viewport accordingly."
  [$container canvas]
  (-> (rx/event-source :resize (jayq/$ js/window))
      (rx/observe
        (fn []
          (-> (jayq/$ canvas)
              (jayq/css
                {:width  (.width $container)
                 :height (.height $container)})))))
  $container)
