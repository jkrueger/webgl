(ns webgl.models.operators.geometry
  (:require [webgl.geometry                 :as geo]
            [webgl.matrix                   :as mat]
            [webgl.models.operators.factory :as f]
            [webgl.models.operators.scalar  :as scalar])
  (:require-macros [webgl.models.operators.macros :as m]))

(defn as-float32 [v]
  (js/Float32Array. v))

(defn as-uint16 [v]
  (js/Uint16Array. v))

(defn- polar [r angle]
  [(* r (js/Math.cos angle))
   (* r (js/Math.sin angle))
   0.0
   1.0])

(defn- interpol [a b steps i]
  (* i (/ (- b a) steps)))

(defn- disc-point [r n i]
  (if (= i n)
    [0.0 0.0 0.0 1.0]
    (polar r (interpol 0.0 (* 2 js/Math.PI) n i))))

(defn- disc-faces [n]
  (->> [n 0 1]
       (iterate
         (fn [[a b c]]
           [a
            (inc b)
            (mod (inc c) n)]))
       (take n)))

(defn- enumerate [n f]
  (->> (iterate inc 0)
       (take n)
       (map f)))

(defn- ->native [as-type coll]
  (->> coll
       (apply concat)
       (into-array)
       (as-type)))

(defn- disc [radius detail]
  (let [num (inc detail)]
    (geo/Geometry.
      (->> (enumerate num (partial disc-point radius num))
           (->native as-float32))
      (->> (repeat [0.0 0.0 1.0 0.0])
           (take num)
           (->native as-float32))
      (->> (disc-faces detail)
           (->native as-uint16)))))

(m/defop :triangle [] :geometry
  "Triangle"
  []
  []
  #(geo/Geometry.
     (-> (array  0.0  0.5 0.0 1.0
                -0.5 -0.5 0.0 1.0
                 0.5 -0.5 0.0 1.0)
         (as-float32))
     (-> (array 0.0 0.0 1.0 0.0
                0.0 0.0 1.0 0.0
                0.0 0.0 1.0 0.0)
         (as-float32))
     (-> (array 0 1 2)
         (as-uint16))))

(m/defop :square [] :geometry
  "Square"
  []
  []
  #(geo/Geometry.
    (-> (array -0.5  0.5 0.0 1.0
                0.5  0.5 0.0 1.0
                0.5 -0.5 0.0 1.0
               -0.5 -0.5 0.0 1.0)
        (as-float32))
    (-> (array 0.0 0.0 1.0 0.0
               0.0 0.0 1.0 0.0
               0.0 0.0 1.0 0.0
               0.0 0.0 1.0 0.0)
        (as-float32))
    (-> (array 0 1 2 0 3 2)
        (as-uint16))))

(m/defop :disc [:scalar :scalar] :geometry
  "Disc"
  [(f/make :constant :scalar {:label "Radius"} 0.5)
   (f/make :constant :scalar {:label "Detail"} 5)]
  []
  disc)

(defn- matrix-transform [m]
  (let [transposed (mat/transpose m)]
    #(mat/* % transposed)))

;; (f/defop :transform [] :geometry
;;   "Transform"
;;   [geometry (f/make :unassigned :geometry)
;;    tx (f/make :constant :scalar 0.0 "Tx")
;;    ty (f/make :constant :scalar 0.0 "Ty")
;;    tz (f/make :constant :scalar 0.0 "Tz")
;;    rx (f/make :constant :scalar 0.0 "Rx")
;;    ry (f/make :constant :scalar 0.0 "Ry")
;;    rz (f/make :constant :scalar 0.0 "Rz")
;;    s  (f/make :constant :scalar 1.0 "S")]
;;    (geo/transform
;;      geometry
;;      (->> mat/identity
;;        (mat/* (mat/scaling s))
;;        (mat/* (mat/translation (mat/make tx ty tz)))
;;        (mat/* (mat/x-rotation rx))
;;        (mat/* (mat/y-rotation ry))
;;        (mat/* (mat/z-rotation rz))
;;        (matrix-transform)))))

;; (defmethod f/make :revolution-solid
;;   )

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

