(ns webgl.operators
  (:require [webgl.geometry :as geo]
            [webgl.matrix   :as mat]))

;; (def constant constantly)

;; (defn time [fps]
;;   (fn [frame]
;;     (/ frame fps)))

;; (defn scale [in s]
;;   (fn [frame]
;;     (* s
;;        (in frame))))

;; (defn offset [in offset]
;;   (fn [frame]
;;     (+ offset
;;        (in frame))))

;; (defn modulate [lhs rhs]
;;   (fn [frame]
;;     (* (lhs frame) (rhs frame))))

;; (defn sin [in]
;;   (fn [frame]
;;     (js/Math.sin (in frame))))

;; (defn cos [in]
;;   (fn [frame]
;;     (js/Math.cos (in frame))))

;; (def quadratic #(* % %))
;; (def cubic     #(* % % %))
;; (def quartic   #(* % % % %))
;; (def quintic   #(* % % % % %))

;; (defn easing [in f]
;;   (fn [frame]
;;     (let [t (in frame)
;;           s (- 1)
;;           c (+ t 1)]
;;       (+ s
;;          (if (< c 1)
;;            (f c)
;;            (- 2 (f (- 2 c))))))))
