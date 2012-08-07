(ns webgl.core
  (:require [goog.dom        :as dom]
            [goog.events     :as event]
            [webgl.api       :as api]
            [webgl.buffers   :as buffer]
            [webgl.constants :as const]
            [webgl.matrix    :as matrix]
            [webgl.program   :as prog]
            [webgl.scalar    :as scalar]
            [webgl.shader    :as sh]))

(def fps 30)

(def triangle
  (array  0.0  0.5 0.0
         -0.5 -0.5 0.0
          0.5 -0.5 0.0))

(def time (scalar/time fps))

(def fragment-code
  "precision mediump float;
   void main()
   {
     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
   }")

(def frame  (atom 0))
(def redraw (atom true))

(defn next-frame []
  (when @redraw
    (swap! frame inc)))

(defn render-frame [program vertex-shader frame]
  (sh/bind vertex-shader program frame)
  (api/clear :color-buffer)
  (api/draw-arrays :triangles 0 3))

(defn render [gl f]
  (when @redraw
    (.requestAnimFrame
      js/window
      (partial render gl f)
      (.-canvas gl))
    (api/with-context gl
      f @frame)))

(defn prepare-program [program vertex-shader]
  (prog/attach! program :vertex   (sh/compile vertex-shader))
  (prog/attach! program :fragment fragment-code)
  (prog/link! program)
  (prog/use! program))

(defn model-view-shader [vertices view]
  (sh/shader (vector vertices view)
    (sh/* vertices view)))

(defn init-scene [canvas]
  (let [program (prog/make)]
      (api/clear-color 0.0 0.0 0.0 1.0)
      (let [gl            (api/context)
            buffer        (buffer/make :array triangle)
            vertices      (sh/attribute sh/vec4
                            (buffer/as-bindable buffer))
            view          (sh/uniform sh/mat4
                            (-> time
                                (scalar/sin)
                                (scalar/easing scalar/quadratic)
                                (scalar/scale js/Math.PI)
                                (matrix/z-rotation)))
            vertex-shader (model-view-shader vertices view)
            renderer      (partial render-frame program vertex-shader)]
        (prepare-program program vertex-shader)
        (js/setInterval next-frame (/ 1000 fps))
        (render gl renderer)
        (event/listen canvas "click"
          (fn [evt]
            (swap! redraw not)
            (when @redraw
              (render gl renderer)))))))

(defn load-gl []
  (let [canvas (dom/$ "gl")]
    (api/with-context
      (api/make-context canvas)
      init-scene
      canvas)))

(defn ^:export init []
  (set! (.-onload js/window) load-gl))
