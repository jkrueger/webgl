(ns webgl.presenters.operator-tree
  (:require [webgl.api      :as gl]
            [webgl.kit.rx   :as rx]
            [webgl.views.gl :as display]))

;; [webgl.geometry  :as geom]
;; [webgl.matrix    :as matrix]
;; [webgl.program   :as prog]
;; [webgl.operators :as op]
;; [webgl.shader    :as sh]

;; (def fragment-code
;;   "precision mediump float;
;;    void main()
;;    {
;;      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
;;    }")

;; (defn render-frame [program vertex-shader frame]
;;   (sh/bind vertex-shader program frame)
;;   (api/clear :color-buffer)
;;   (api/draw-elements :triangles
;;                      (* triangles 3)
;;                      :unsigned-short
;;                      0))

;; (defn prepare-program [program vertex-shader]
;;   (prog/attach! program :vertex   (sh/compile vertex-shader))
;;   (prog/attach! program :fragment fragment-code)
;;   (prog/link! program)
;;   (prog/use! program))

;; (defn model-view-shader [vertices view]
;;   (sh/shader [vertices view]
;;     (sh/* vertices view)))

;; (defn init-scene [canvas]
;;   (let [program (prog/make)]
;;       (let [gl            (api/context)
;;             view          (sh/uniform sh/mat4
;;                             (constantly matrix/identity))
;;             vertex-shader (model-view-shader vertices view)
;;             renderer      (partial render-frame program vertex-shader)]
;;         (prepare-program program vertex-shader)))))

(defn frame [n]
  (gl/clear-color 0.0 0.0 0.0 1.0)
  (gl/clear :color-buffer))

(defn present [model view]
  (rx/observe (:frames view) frame)
  (-> (rx/event-source :click (:dom view))
      (rx/observe
       (fn [_]
         (if (display/paused? view)
           (display/resume view)
           (display/pause view)))))
  (display/start view)
  (display/pause view)
  nil)
