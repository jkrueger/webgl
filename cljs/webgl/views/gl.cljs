(ns webgl.views.gl
  (:require [crate.core               :as crate]
            [jayq.core                :as jayq]
            [webgl.kit.rx             :as rx]
            [webgl.matrix             :as mat]
            [webgl.views.gl.api       :as api]
            [webgl.views.gl.buffer    :as buffer]
            [webgl.views.gl.program   :as prog]
            [webgl.views.gl.protocols :as p]
            [webgl.views.gl.shader    :as sh])
  (:require-macros [crate.def-macros  :as c]))

(def fps 30)
(def frame-timeout (/ 1000 fps))

(def fragment-code
  "precision mediump float;
   void main()
   {
     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
   }")

(defrecord View [dom context paused frames program geometry])

(c/defpartial canvas [$container]
  [:canvas {:width (.width $container) :height (.height $container)}])

(declare resize-to-container renderer make-geometry-program)

(defn setup-context [dom]
  (let [context (js/WebGLUtils.setupWebGL dom)]
    (when-not context
      (throw (js/Error. "Your browser does not support webgl")))
    context))

(defn make [container]
  (let [$container (jayq/$ container)
        dom        (canvas $container)
        context    (setup-context dom)
        program    (make-geometry-program context)
        frames     (rx/channel)
        geometry   (atom nil)]
    (-> $container
        (jayq/append dom)
        (resize-to-container dom))
    (rx/observe frames (renderer program geometry))
    (View. dom
           context
           (atom false)
           frames
           program
           geometry)))

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
  [view f & args]
  (apply api/with-context (:context view) f view args))

(defn- request-another-frame
  "This implements the recommended way of doing
   framed animation by requesting a redraw from the
   browser"
  [view f]
  (.requestAnimFrame js/window f (:dom view)))

(defn- fire-render
  "Trigger the frame event so that clients can render
   the scene"
  [view]
  (rx/event (:frames view) 0)) ;; TODO: pass frame number

(defn- frame
  "Triggers a redraw and requests another frame from
   the browser"
  [view]
  (when-not (paused? view)
    (js/setTimeout
     (fn []
       (request-another-frame
        view
        (partial frame view)))
     frame-timeout)
    (onto view fire-render)))

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

;;; geometry rendering implementation

(defn- renderer [program geometry]
  (fn [frame]
    (api/clear-color 0.0 0.0 0.0 1.0)
    (api/clear :color-buffer)
    (when-let [vertices @geometry]
      (let [native  (:native program)
            shader  (:vertex-shader  program)
            channel (:vertex-channel program)
            view    (:view-matrix program)]
        (sh/bind view    native mat/identity)
        (sh/bind channel native vertices)
        (api/draw-elements :triangles
          (* (buffer/num-triangles vertices) 3)
          :unsigned-short
          0)))))

(defn- model-view-shader [vertices view]
  (sh/shader [vertices view]
    (sh/* vertices view)))

(defn- prepare-program [program vertex-shader]
  (prog/attach! program :vertex   (sh/compile vertex-shader))
  (prog/attach! program :fragment fragment-code)
  (prog/link! program)
  (prog/use! program))

(defn- make-geometry-program [context]
  (api/with-context context
    (fn []
      (let [program          (prog/make)
            vertex-attribute (sh/attribute sh/vec4)
            model-view       (sh/uniform   sh/mat4)
            shader           (model-view-shader vertex-attribute model-view)]
        (prepare-program program shader)
        {:native         program
         :vertex-shader  shader
         :vertex-channel vertex-attribute
         :view-matrix    model-view}))))

(defn set-geometry [view geometry]
  (api/with-context (:context view)
    #(reset! (:geometry view) (p/factory geometry))))

(defn set-geometry-data [view geometry]
  (let [buffered @(:geometry view)]
    (api/with-context (:context view)
      (fn []
        (buffer/set-data (:vertices buffered) (:vertices geometry))
        (buffer/set-data (:indices  buffered) (:indices geometry))))))
