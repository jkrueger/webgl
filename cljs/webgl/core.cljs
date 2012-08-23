(ns webgl.core
  (:require [goog.dom        :as dom]
            [goog.events     :as event]
            [webgl.api       :as api]
            [webgl.constants :as const]
            [webgl.editor    :as editor]
            [webgl.geometry  :as geom]
            [webgl.matrix    :as matrix]
            [webgl.program   :as prog]
            [webgl.operators :as op]
            [webgl.shader    :as sh]
            ;; development stuff
            [clojure.browser.repl :as repl]))

(def fps  30)
(def time (op/time fps))
(def zero (op/constant 0.0))
(def one  (op/constant 1.0))
(def up   (op/constant 0.5))

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

(def triangles 10)

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

(defn make-trans [m]
  (let [transposed (matrix/transpose m)]
    #(matrix/* % transposed)))

(defn init-scene [canvas]
  (let [program (prog/make)]
      (api/clear-color 0.0 0.0 0.0 1.0)
      (let [gl            (api/context)
            copy-trans    (matrix/*
                            (matrix/translation
                              (matrix/make 0.3 -0.1 0.0 0.0))
                            (matrix/z-rotation
                              (- (/ js/Math.PI 5))))
            vertices      (sh/attribute sh/vec4
                            (-> geom/triangle
                                (op/cloner (- triangles 1) copy-trans)
                                (op/transformer zero
                                                (-> (op/sin time)
                                                    (op/easing op/cubic)
                                                    (op/offset 0.5))
                                                zero
                                                zero zero
                                                (op/offset (op/sin time) 1.0)
                                                (op/constant 2.0))
                                (op/bufferer)))
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

(defn load []
  (let [canvas (dom/$ "gl")]
    (editor/load-config "configs/editor.xml")
    (api/with-context
      (js/WebGLDebugUtils.makeDebugContext
        (api/make-context canvas))
      init-scene
      canvas)))

(defn ^:export init []
;;  (repl/connect "http://localhost:9000/repl")
  (set! (.-onload js/window) load))
