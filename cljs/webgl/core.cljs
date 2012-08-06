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

(def frame  (atom 0))
(def redraw (atom true))

(defn next-frame []
  (when @redraw
    (swap! frame inc)))

(defn render-frame [gl program vertex-buffer]
  (when @redraw
    (.requestAnimFrame
       js/window
       (partial render-frame gl program vertex-buffer)
       (.-canvas gl))
    (api/with-context gl
      (fn []
        (let [rot (rotation @frame)]
          (sh/bind position program vertex-buffer)
          (sh/bind view program rot)
          (api/clear :color-buffer)
          (api/draw-arrays :triangles 0 3))))))

(defn init-scene [canvas]
  (let [program (prog/make)]
      (prog/attach! program :vertex   (sh/compile vertex-shader))
      (prog/attach! program :fragment fragment-code)
      (prog/link! program)
      (prog/use! program)
      (api/clear-color 0.0 0.0 0.0 1.0)
      (let [gl     (api/context)
            buffer (buffer/make :array vertices)]
        (js/setInterval next-frame (/ 1000 fps))
        (render-frame gl program buffer)
        (event/listen canvas "click"
          (fn [evt]
            (swap! redraw not)
            (when @redraw
              (render-frame gl program buffer)))))))

(defn load-gl []
  (let [canvas (dom/$ "gl")]
    (api/with-context
      (api/make-context canvas)
      init-scene
      canvas)))

(defn ^:export init []
  (set! (.-onload js/window) load-gl))
