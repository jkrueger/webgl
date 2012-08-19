(ns webgl.operators
  (:require [webgl.geometry :as geo]
            [webgl.matrix   :as mat]))

(def constant constantly)

(defn time [fps]
  (fn [frame]
    (/ frame fps)))

(defn scale [in s]
  (fn [frame]
    (* s
       (in frame))))

(defn offset [in offset]
  (fn [frame]
    (+ offset
       (in frame))))

(defn modulate [lhs rhs]
  (fn [frame]
    (* (lhs frame) (rhs frame))))

(defn sin [in]
  (fn [frame]
    (js/Math.sin (in frame))))

(defn cos [in]
  (fn [frame]
    (js/Math.cos (in frame))))

(def quadratic #(* % %))
(def cubic     #(* % % %))
(def quartic   #(* % % % %))
(def quintic   #(* % % % % %))

(defn easing [in f]
  (fn [frame]
    (let [t (in frame)
          s (- 1)
          c (+ t 1)]
      (+ s
         (if (< c 1)
           (f c)
           (- 2 (f (- 2 c))))))))

(defn- matrix-transform [m]
  (let [transposed (mat/transpose m)]
    #(mat/* % transposed)))

(defn transformer [geometry tx ty tz x y z s]
  (fn [frame]
    (let [g  (geometry frame)
          tx (tx frame)
          ty (ty frame)
          tz (tz frame)
          x  (x frame)
          y  (y frame)
          z  (z frame)
          s  (s frame)]
      (geo/transform
        (->> mat/identity           
             (mat/* (mat/scaling s))
             (mat/* (mat/translation (mat/make tx ty tz)))
             (mat/* (mat/x-rotation x))
             (mat/* (mat/y-rotation y))
             (mat/* (mat/z-rotation z))
             (matrix-transform))
        g))))

(defn cloner [geometry n t]
  (fn [frame]
    (geo/clone n (matrix-transform t) geometry)))

(defn bufferer [geometry]
  (fn [frame]
    (-> frame (geometry) (geo/as-buffered))))
