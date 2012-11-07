(ns webgl.models.operators.geometry
  (:require [webgl.geometry                 :as geo]
            [webgl.matrix                   :as mat]
            [webgl.vector                   :as vec]
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

(defn- aiterate [acoll n trans]
  (let [length (.-length acoll)
        n      (inc n)
        ctor   (type acoll)
        out    (ctor. (* n length))]
    (.set out acoll)
    (loop [i        1
           original acoll]
      (when (< i n)
        (let [offset      (* i length)
              end         (+ offset length)
              destination (.subarray out offset end)]
          (->> original
               (trans)
               (.set destination))
          (recur (inc i) destination))))
    out))

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

(m/defop :disc [:float :integer] :geometry
  "Disc"
  [(f/make :constant :float   {:label "Radius"} 0.5)
   (f/make :constant :integer {:label "Detail"} 5)]
  []
  disc)

(defn- matrix-transform [m]
  (let [transposed (mat/transpose m)]
    #(mat/* % transposed)))

(m/defop :transform
  [:geometry :float :float :float :float :float :float :float] :geometry
  "Transform"
  [(f/make :unassigned :geometry)
   (f/make :constant :float 0.0 "Tx")
   (f/make :constant :float 0.0 "Ty")
   (f/make :constant :float 0.0 "Tz")
   (f/make :constant :float 0.0 "Rx")
   (f/make :constant :float 0.0 "Ry")
   (f/make :constant :float 0.0 "Rz")
   (f/make :constant :float 1.0 "S")]
  []
  (fn [in tx ty tz rx ry rz s]
    (geo/transform
     in
     (->> mat/identity
          (mat/* (mat/scaling s))
          (mat/* (mat/translation (mat/make tx ty tz)))
          (mat/* (mat/x-rotation rx))
          (mat/* (mat/y-rotation ry))
          (mat/* (mat/z-rotation rz))
          (matrix-transform)))))

(m/defop :revolution-solid [:geometry :integer] :geometry
  "Revolution Solid"
  [(f/make :unassigned :geometry)
   (f/make :constant :scalar {:label "Detail"} 5)]
  []
  (fn [detail in]
    (println "TEST")
    in
    ;; (let [t (-> mat/identity
    ;;             (mat/translate (vec/make 1.0 0.0 0.0))
    ;;             (matrix-transform))
    ;;       d (-> mat/identity
    ;;             (mat/y-rotatation (/ (* 2 js/Math.PI) detail))
    ;;             (matrix-transform))
    ;;       n (.-length (:vertices in))]
    ;;   (geo/Geometry.
    ;;     ;; copy vertices n times and transform
    ;;     (aiterate (t (:vertices in))
    ;;               detail
    ;;               d)
    ;;     ;; make fresh normals
    ;;     (-> (repeat (* detail n) [0.0 0.0 1.0 0.0])
    ;;         (->native as-float32))
    ;;     ;; generate new face indices
    ;;     (aiterate (array 0 1 n n 1 (inc n))
    ;;               (/ (* n detail) 2)
    ;;               (fn [square]
    ;;                 (let [faces (js/Uint16Array. 6)]
    ;;                   (aset faces 0 (inc (aget square 0)))
    ;;                   (aset faces 1 (inc (aget square 1)))
    ;;                   (aset faces 2 (inc (aget square 2)))
    ;;                   (aset faces 3 (inc (aget square 3)))
    ;;                   (aset faces 4 (inc (aget square 4)))
    ;;                   (aset faces 5 (inc (aget square 5)))
    ;;                   faces)))))
    ))

;;; FIXME: write operators for these

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

