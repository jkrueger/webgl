(ns webgl.core
  (:require [goog.dom        :as dom]
            [webgl.api       :as api]
            [webgl.buffers   :as buffer]
            [webgl.constants :as const]
            [webgl.matrix    :as matrix]
            [webgl.program   :as prog]
            [webgl.scalar    :as scalar]
            [webgl.shader    :as sh]))

(def fps 30)

(def vertices
  (array  0.0  0.5 0.0
         -0.5 -0.5 0.0
          0.5 -0.5 0.0))

(def position
  (sh/attribute sh/vec4))

(def view
  (sh/uniform sh/mat4))

(def time (scalar/time fps))

(def rotation
  (-> time
      (scalar/sin)
      (scalar/easing scalar/quadratic)
      (scalar/scale js/Math.PI)
      (matrix/rotation)))

(def vertex-shader
  (sh/shader (vector position view)
    (sh/* position view)))

(def fragment-code
  "precision mediump float;
   void main()
   {
     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
   }")

(defn load-gl []
  (let [canvas (dom/$ "gl")]
    (binding [api/*context* (api/make-context canvas)]
      (let [program (prog/make)]
        (prog/attach! program :vertex   (sh/compile vertex-shader))
        (prog/attach! program :fragment fragment-code)
        (prog/link! program)
        (prog/use! program)))
    (let [buffer       (buffer/make gl :array vertices)
          frame        (atom 0)
          next-frame   (fn []
                         (swap! frame inc))
          render-frame (fn render-frame []
                         (.requestAnimFrame js/window render-frame canvas)
                         (let [rot (rotation @frame)]
                           (.clearColor gl 0.0 0.0 0.0 1.0)
                           (.clear gl (const/get :color-buffer))
                           (sh/bind view gl prog rot)
                           (.drawArrays gl (const/get :triangles) 0 3)))]
      (sh/bind position gl prog buffer)
      (js/setInterval next-frame (/ 1000 fps))
      (render-frame)
      )))

(defn ^:export init []
  (set! (.-onload js/window) load-gl))
