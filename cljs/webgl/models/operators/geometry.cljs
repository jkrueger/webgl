(ns webgl.models.operators.geometry
  (:require [webgl.geometry                 :as geo]
            [webgl.matrix                   :as mat]
            [webgl.models.operators.factory :as f]
            [webgl.models.operators.scalar  :as scalar]))

(defn as-float32 [v]
  (js/Float32Array. v))

(defn as-uint16 [v]
  (js/Uint16Array. v))

(defn- disc-point [r n i]
  (let [angle (/ (* 2 js/Math.PI) n)]
    [(* r (js/Math.cos angle))
     (* r (js/Math.sin angle))]))

(defn- disc-triangles [n]
  (take n (iterate #(map inc %) [0 1 2])))

(defn- disc [n]
  (geo/Geometry.
    (->> (iterate inc 1)
         (take n)
         (mapcat (partial disc-point 1.0 n))
         (into-array)
         (as-float32))
    (->> (disc-triangles n)
         (apply concat)
         (into-array)
         (as-uint16))))

(defn- triangle []
  (geo/Geometry.
      (-> (array  0.0  0.1 0.0 1.0
                 -0.1 -0.1 0.0 1.0
                  0.1 -0.1 0.0 1.0)
          (as-float32))
      (-> (array 0 1 2)
          (as-uint16))))

(defmethod f/make :triangle
  [_]
  (f/operator :triangle :geometry nil triangle "Triangle"))

(defmethod f/make :disc
  [_]
  (f/operator
   :disc :geometry
   [(f/make :constant :scalar 5 "Detail")]
   disc
   "Disc"))

(defn- matrix-transform [m]
  (let [transposed (mat/transpose m)]
    #(mat/* % transposed)))

(defn- transform [geometry tx ty tz rx ry rz s]
  (geo/transform
    geometry
    (->> mat/identity
         (mat/* (mat/scaling s))
         (mat/* (mat/translation (mat/make tx ty tz)))
         (mat/* (mat/x-rotation rx))
         (mat/* (mat/y-rotation ry))
         (mat/* (mat/z-rotation rz))
         (matrix-transform))))

(defmethod f/make :transform
  [_]
  (f/operator
    :transform :geometry
    [(f/make :unassigned :geometry)
     (f/make :constant :scalar 0.0 "Tx")
     (f/make :constant :scalar 0.0 "Ty")
     (f/make :constant :scalar 0.0 "Tz")
     (f/make :constant :scalar 0.0 "Rx")
     (f/make :constant :scalar 0.0 "Ry")
     (f/make :constant :scalar 0.0 "Rz")
     (f/make :constant :scalar 1.0 "S")]
    transform
    "Transform"))

;;; FIXME: write operators for these

;; (defn- aiterate [acoll n trans]
;;   (let [length (.-length acoll)
;;         n      (inc n)
;;         ctor   (type acoll)
;;         out    (ctor. (* n length))]
;;     (.set out acoll)
;;     (loop [i        1
;;            original acoll]
;;       (when (< i n)
;;         (let [offset      (* i length)
;;               end         (+ offset length)
;;               destination (.subarray out offset end)]
;;           (->> original
;;                (trans)
;;                (.set destination))
;;           (recur (inc i) destination))))
;;     out))

;; (defn- cloned-indices [indices]
;;   (let [c   (.-length indices)
;;         out (js/Uint16Array. c)]
;;     (dotimes [x c]
;;       (aset out
;;             x
;;             (+ (aget indices x)
;;                c)))
;;     out))

;; (defn clone [n trans in]
;;   (Geometry.
;;     (aiterate (:vertices in)
;;               n
;;               trans)
;;     (aiterate (:indices in)
;;               n
;;               cloned-indices)))

