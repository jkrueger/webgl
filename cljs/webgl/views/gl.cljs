(ns webgl.views.gl
  (:require [crate.core               :as crate]
            [jayq.core                :as jayq]
            [webgl.kit.rx             :as rx]
            [webgl.matrix             :as mat]
            [webgl.vector             :as vec]
            [webgl.views.gl.api       :as api]
            [webgl.views.gl.buffer    :as buffer]
            [webgl.views.gl.program   :as prog]
            [webgl.views.gl.protocols :as p]
            [webgl.views.gl.shader    :as sh])
  (:require-macros [crate.def-macros  :as c]))

(def fov (* 0.5 js/Math.PI))
(def fps 30)
(def frame-timeout (/ 1000 fps))
(def translation (mat/translation 0.0 0.0 3.0))

(def vertex-shader
  "uniform mat4 view;
   uniform mat4 normal_view;
   uniform mat4 projected_view;

   attribute vec4 in_vertex;
   attribute vec4 in_normal;

   varying vec4 normal;
   varying vec4 L;
   
   void main()
   {
     vec4 vertex = in_vertex * view;
     normal      = in_normal * normal_view;

     vec4 eye = vec4(0.0, 0.0, -5.0, 1.0);
     L        = eye - vertex;

     gl_Position = in_vertex * projected_view;
   }")

(def fragment-code
  "precision mediump float;

   varying vec4 normal;
   varying vec4 L;

   void main()
   {
     vec4  nn      = normalize(normal);
     vec4  nL      = normalize(L);
     float diffuse = clamp(dot(nn, nL), 0.0, 1.0);

     gl_FragColor = vec4(diffuse, diffuse, diffuse, 1.0);
   }")

(def model-view
  (sh/uniform sh/mat4 "view"))

(def normal-view
  (sh/uniform sh/mat4 "normal_view"))

(def model-view-projection
  (sh/uniform sh/mat4 "projected_view"))

(def vertex-channels
  (sh/channels
    :vertices (sh/attribute sh/vec4 "in_vertex")
    :normals  (sh/attribute sh/vec4 "in_normal")))

(defrecord View
  [dom
   ;; render state varaibles
   paused
   frames
   ;; the webgl context and program used by the view
   context
   program
   ;; the currently rendered geomtry
   geometry
   ;; world and screen transformations
   view
   normal-view
   projection])

(c/defpartial canvas [$container]
  [:canvas {:width (.width $container) :height (.height $container)}])

(declare resize-to-container renderer make-geometry-program)

(defn setup-context [dom]
  (let [context (js/WebGLUtils.setupWebGL dom)]
    (when-not context
      (throw (js/Error. "Your browser does not support webgl")))
    context))

(defn setup-projection [container]
  (mat/projection
    fov
    (.width  container)
    (.height container)
    0.001
    100.0))

(defn make [container]
  (let [$container (jayq/$ container)
        dom        (canvas $container)
        context    (setup-context dom)
        program    (make-geometry-program context)
        frames     (rx/channel)
        geometry   (atom nil)
        model-view (atom translation)
        projection (atom (setup-projection $container))
        view       (View. dom
                          (atom false)
                          frames
                          context
                          program
                          geometry
                          model-view
                          (atom (mat/normal-transform @model-view))
                          projection)]
    (-> $container
        (jayq/append dom)
        (resize-to-container dom context projection))
    (rx/observe frames (renderer view))
    view))

(defn width [view]
  (.width (jayq/$ (:dom view))))

(defn height [view]
  (.height (jayq/$ (:dom view))))

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
  [$container canvas context projection]
  (-> (rx/event-source :resize (jayq/$ js/window))
      (rx/observe
        (fn []
          (-> (jayq/$ canvas)
              (jayq/css
                {:width  (.width $container)
                 :height (.height $container)}))
           (api/with-context context api/viewport
             0 0 (.width $container) (.height $container))
          (reset! projection (setup-projection $container)))))
  $container)

;;; geometry rendering implementation

(defn- renderer [view]
  (fn [frame]
    (api/enable :cull)
    (api/enable :depth-test)
    (api/clear-color 0.2 0.2 0.2 1.0)
    (api/clear :color-buffer)
    (api/clear :z-buffer)
    (when-let [channel-data @(:geometry view)]
      (let [program      (:program view)
            native       (:native program)
            current-view (:view view)
            n-view       (:normal-view view)
            projection   (:projection view)]
        (sh/bind model-view  native @current-view)
        (sh/bind normal-view native @n-view)
        (sh/bind model-view-projection native (mat/* @projection @current-view))
        (sh/bind vertex-channels native channel-data)
        (buffer/bind (:indices channel-data))
        (api/draw-elements :triangles
          (* (buffer/num-triangles channel-data) 3)
          :unsigned-short
          0)))))

(defn- prepare-program [program]
  (prog/attach! program :vertex   vertex-shader)
  (prog/attach! program :fragment fragment-code)
  (prog/link! program)
  (prog/use! program))

(defn- make-geometry-program [context]
  (api/with-context context
    (fn []
      (let [program (prog/make)]
        (prepare-program program)
        {:native program}))))

(defn set-geometry [view geometry]
  (api/with-context (:context view)
    (fn []
      (if @(:geometry view)
        (swap!  (:geometry view) buffer/update-buffer geometry)
        (reset! (:geometry view) (p/factory geometry))))))

(defn rotation [view m]
  (let [trans (mat/* translation m)]
    (reset! (:view view)        trans)
    (reset! (:normal-view view) (mat/normal-transform trans))))
