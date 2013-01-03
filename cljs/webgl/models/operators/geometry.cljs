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

(m/defop :cube [] :geometry
  "Cube"
  []
  []
  #(geo/Geometry.
    (-> (array ;; front
               -0.5  0.5 -0.5 1.0
                0.5  0.5 -0.5 1.0
                0.5 -0.5 -0.5 1.0
               -0.5 -0.5 -0.5 1.0
               ;; back
                0.5  0.5  0.5 1.0
               -0.5  0.5  0.5 1.0
               -0.5 -0.5  0.5 1.0
                0.5 -0.5  0.5 1.0
               ;; left
               -0.5  0.5  0.5 1.0
               -0.5  0.5 -0.5 1.0
               -0.5 -0.5 -0.5 1.0
               -0.5 -0.5  0.5 1.0
               ;; right
                0.5  0.5 -0.5 1.0
                0.5  0.5  0.5 1.0
                0.5 -0.5  0.5 1.0
                0.5 -0.5 -0.5 1.0
               ;; top
               -0.5  0.5  0.5 1.0
                0.5  0.5  0.5 1.0
                0.5  0.5 -0.5 1.0
               -0.5  0.5 -0.5 1.0
               ;; bottom
                0.5 -0.5  0.5 1.0
               -0.5 -0.5  0.5 1.0
               -0.5 -0.5 -0.5 1.0
                0.5 -0.5 -0.5 1.0)
        (as-float32))
    (-> (array ;; front
                0.0  0.0 -1.0 0.0
                0.0  0.0 -1.0 0.0
                0.0  0.0 -1.0 0.0
                0.0  0.0 -1.0 0.0
               ;; back
                0.0  0.0  1.0 0.0
                0.0  0.0  1.0 0.0
                0.0  0.0  1.0 0.0
                0.0  0.0  1.0 0.0
               ;; left
               -1.0  0.0  0.0 0.0
               -1.0  0.0  0.0 0.0
               -1.0  0.0  0.0 0.0
               -1.0  0.0  0.0 0.0
               ;; right
                1.0  0.0  0.0 0.0
                1.0  0.0  0.0 0.0
                1.0  0.0  0.0 0.0
                1.0  0.0  0.0 0.0
               ;; top
                0.0  1.0  0.0 0.0
                0.0  1.0  0.0 0.0
                0.0  1.0  0.0 0.0
                0.0  1.0  0.0 0.0
               ;; bottom
                0.0 -1.0  0.0 0.0
                0.0 -1.0  0.0 0.0
                0.0 -1.0  0.0 0.0
                0.0 -1.0  0.0 0.0)
        (as-float32))
    (-> (array 0  2  1  0  3  2
               4  6  5  4  7  6
               8  10 9  8  11 10
               12 14 13 12 15 14
               16 18 17 16 19 18
               20 22 21 20 23 22)
        (as-uint16))))

(defn- matrix-transform [m geometry]
  (let [transposed (mat/transpose m)]
    (mat/* geometry transposed)))

(m/defop :transform
  [:geometry :vector :vector :vector] :geometry
  "Transform"
  [(f/make :unassigned :geometry)
   (f/make :constant :vector {:label "Translation"} (vec/make 0.0 0.0 0.0))
   (f/make :constant :vector {:label "Rotation"}    (vec/make 0.0 0.0 0.0))
   (f/make :constant :vector {:label "Scale"}       (vec/make 1.0 1.0 1.0))]
  []
  (fn [in t r s]
    (let [trans (->> mat/identity
                     (mat/* (mat/scaling s))
                     (mat/* (mat/translation t))
                     (mat/* (mat/x-rotation (aget r 0)))
                     (mat/* (mat/y-rotation (aget r 1)))
                     (mat/* (mat/z-rotation (aget r 2))))
          tnorm (mat/normal-transform trans)]
      (geo/Geometry.
        (matrix-transform trans (:vertices in))
        (matrix-transform tnorm (:normals in))
        (:indices in)))))

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
  [:geometry :integer :vector :vector :vector] :geometry
  "Clone"
  [(f/make :unassigned :geometry)
   (f/make :constant :integer {:label "Copies"}      2)
   (f/make :constant :vector  {:label "Translation"} (vec/make 0.0 0.0 0.0))
   (f/make :constant :vector  {:label "Rotation"}    (vec/make 0.0 0.0 0.0))
   (f/make :constant :vector  {:label "Scale"}       (vec/make 1.0 1.0 1.0))]
  []
  (fn [in n t r s]
    (let [trans (->> mat/identity
                     (mat/* (mat/scaling s))
                     (mat/* (mat/translation t))
                     (mat/* (mat/x-rotation (aget r 0)))
                     (mat/* (mat/y-rotation (aget r 1)))
                     (mat/* (mat/z-rotation (aget r 2))))
          tnorm (mat/normal-transform trans)]
      (geo/Geometry.
       (aiterate (:vertices in)
                 n
                 (partial matrix-transform trans))
       (aiterate (:normals in)
                 n
                 (partial matrix-transform tnorm))
       (aiterate (:indices in)
                 n
                 (partial cloned-indices (geo/num-vertices in)))))))

(defn- deface [arr i]
  (.subarray arr i (+ i 4)))

(defn faces->normals [vertices indices]
  (let [normals (js/Float32Array. (.-length vertices))
        n       (/ (.-length indices) 3)]
    (dotimes [face n]
      (let [off       (* 3 face)
            end       (+ 3 off)
            face-view (.subarray indices off end)
            ai        (* 4 (aget face-view 0))
            bi        (* 4 (aget face-view 1))
            ci        (* 4 (aget face-view 2))
            a         (deface vertices ai)
            b         (deface vertices bi)
            c         (deface vertices ci)
            normal    (vec/cross (vec/- c a) (vec/- b a))]
        (vec/+= (deface normals ai) normal)
        (vec/+= (deface normals bi) normal)
        (vec/+= (deface normals ci) normal)))
    (dotimes [i (.-length normals)]
      (let [off         (* i 4)
            normal-view (.subarray normals off (+ off 4))]
        (vec/normalize normal-view)))
    normals))

(m/defop :revolution-solid [:geometry :integer] :geometry
  "Revolution Solid"
  [(f/make :unassigned :geometry)
   (f/make :constant :integer {:label "Detail"} 20)
   (f/make :constant :float   {:label "Radius"} 0.5)]
  []
  (fn [in detail radius]
    (let [t     (-> mat/identity
                    (mat/* (mat/translation radius 0.0 0.0)))
          d     (-> mat/identity
                    (mat/* (mat/y-rotation (/ (* 2 js/Math.PI) detail))))
          n     (geo/num-vertices in)
          nt    (geo/num-triangles in)
          verts (aiterate (matrix-transform t (:vertices in)) (dec detail) (partial matrix-transform d))
          faces (let [length  (* 6 nt)
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
                  out)]
      (geo/Geometry.
       verts
       (faces->normals verts faces)
       faces))))
