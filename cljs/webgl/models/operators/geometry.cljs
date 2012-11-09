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
  [(f/make :constant :float   {:label "Radius"} 0.1)
   (f/make :constant :integer {:label "Detail"} 20)]
  []
  disc)

(defn- matrix-transform [m]
  (let [transposed (mat/transpose m)]
    #(mat/* % transposed)))

(m/defop :transform
  [:geometry :float :float :float :angle :angle :angle :float] :geometry
  "Transform"
  [(f/make :unassigned :geometry)
   (f/make :constant :float {:label "Tx"} 0.0)
   (f/make :constant :float {:label "Ty"} 0.0)
   (f/make :constant :float {:label "Tz"} 0.0)
   (f/make :constant :angle {:label "Rx"} 0.0)
   (f/make :constant :angle {:label "Ry"} 0.0)
   (f/make :constant :angle {:label "Rz"} 0.0)
   (f/make :constant :float {:label "S"}  1.0)]
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

(defn- cloned-indices [num-vertices indices]
  (let [c   (.-length indices)
        out (js/Uint16Array. c)]
    (dotimes [x c]
      (aset out
            x
            (+ (aget indices x)
               num-vertices)))
    out))

(m/defop :clone
  [:geometry :integer :float :float :float :angle :angle :angle :float] :geometry
  "Clone"
  [(f/make :unassigned :geometry)
   (f/make :constant :integer {:label "Copies"} 2)
   (f/make :constant :float   {:label "Tx"} 0.0)
   (f/make :constant :float   {:label "Ty"} 0.0)
   (f/make :constant :float   {:label "Tz"} 0.0)
   (f/make :constant :angle   {:label "Rx"} 0.0)
   (f/make :constant :angle   {:label "Ry"} 0.0)
   (f/make :constant :angle   {:label "Rz"} 0.0)
   (f/make :constant :float   {:label "S"}  1.0)]
  []
  (fn [in n tx ty tz rx ry rz s]
    (geo/Geometry.
     (aiterate (:vertices in)
               n
               (->> mat/identity
                    (mat/* (mat/scaling s))
                    (mat/* (mat/translation (mat/make tx ty tz)))
                    (mat/* (mat/x-rotation rx))
                    (mat/* (mat/y-rotation ry))
                    (mat/* (mat/z-rotation rz))
                    (matrix-transform)))
     (aiterate (:normals in)
               n
               identity)
     (aiterate (:indices in)
               n
               (partial cloned-indices (geo/num-vertices in))))))

(m/defop :revolution-solid [:geometry :integer] :geometry
  "Revolution Solid"
  [(f/make :unassigned :geometry)
   (f/make :constant :integer {:label "Detail"} 5)
   (f/make :constant :float   {:label "Radius"} 0.5)]
  []
  (fn [in detail radius]
    (let [t (-> mat/identity
                (mat/* (mat/translation (vec/make radius 0.0 0.0)))
                (matrix-transform))
          d (-> mat/identity
                (mat/* (mat/y-rotation (/ (* 2 js/Math.PI) detail)))
                (matrix-transform))
          n  (geo/num-vertices in)
          nt (geo/num-triangles in)]
      (geo/Geometry.
       ;; copy vertices n times and transform
       (aiterate (t (:vertices in))
                 (dec detail)
                 d)
       ;; make fresh normals
       (->> (repeat (* n (+ 1 detail)) [0.0 0.0 1.0 0.0])
            (->native as-float32))
       ;; generate new face indices
       (let [length  (* 6 nt)
             out     (js/Uint16Array. (* 6 nt detail))]
         (loop [i 0]
           (when (< i detail)
             (let [off       (* i length)
                   end       (+ off length)
                   out-view  (.subarray out off end)
                   ring      (* n i)
                   next-ring (* n (mod (inc i) detail))]
               (loop [j 0]
                 (when (< j nt)
                   (let [num-indx  6
                         off-indx  (* j num-indx)
                         face-view (.subarray out-view off-indx (+ off-indx num-indx))
                         vcur      (+ j ring)
                         vnxt      (+ j next-ring)
                         vcur*     (+ (mod (inc j) nt) ring)
                         vnxt*     (+ (mod (inc j) nt) next-ring)]
                     (aset face-view 0 vcur)
                     (aset face-view 1 vcur*)
                     (aset face-view 2 vnxt)
                     (aset face-view 3 vnxt)
                     (aset face-view 4 vcur*)
                     (aset face-view 5 vnxt*)
                     (recur (inc j)))))
               (recur (inc i)))))
         out)))))
