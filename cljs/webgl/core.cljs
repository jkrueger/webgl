(ns webgl.core
  (:require [goog.dom        :as dom]
            [goog.events     :as event]
            [webgl.api       :as api]
            [webgl.constants :as const]
            [webgl.geometry  :as geom]
            [webgl.matrix    :as matrix]
            [webgl.program   :as prog]
            [webgl.scalar    :as scalar]
            [webgl.shader    :as sh]
            ;; development stuff
            [clojure.browser.repl :as repl]))

(def fps 30)

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

(def triangles 4)

(defn render-frame [program vertex-shader frame]
  (sh/bind vertex-shader program frame)
  (api/clear :color-buffer)
  (api/draw-elements :triangles
                     (* triangles 3)
                     :unsigned-short
                     0))

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
  (sh/shader [vertices view]
    (sh/* vertices view)))

(defn init-scene [canvas]
  (let [program (prog/make)]
      (api/clear-color 0.0 0.0 0.0 1.0)
      (let [gl            (api/context)
            copy-trans    (matrix/*
                            (matrix/z-rotation
                              (- (/ js/Math.PI 5)))
                            (matrix/translation
                             (matrix/make 0.3 -0.1 0.0 0.0)))
            move-trans    (matrix/translation
                              (matrix/make 0.0 0.5 0.0 0.0))
            vertices      (sh/attribute sh/vec4
                            (->> geom/triangle
                                 (geom/clone (- triangles 1)
                                   #(matrix/** %1 %2 copy-trans))
                                 (geom/transform
                                   #(matrix/** %1 %2 move-trans))
                                 (geom/as-buffered)
                                 (constantly)))
            view          (sh/uniform sh/mat4
                            (constantly matrix/identity))
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
      (js/WebGLDebugUtils.makeDebugContext
        (api/make-context canvas))
      init-scene
      canvas)))

(defn ^:export init []
  (repl/connect "http://localhost:9000/repl")
  (set! (.-onload js/window) load-gl))
