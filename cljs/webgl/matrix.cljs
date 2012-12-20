(ns webgl.matrix
  (:refer-clojure :exclude (identity * =))
  (:require-macros [webgl.macros.matrix :as mac]))

(def make (comp #(js/Float32Array. %) array))

(def identity
  (make 1.0 0.0 0.0 0.0
        0.0 1.0 0.0 0.0
        0.0 0.0 1.0 0.0
        0.0 0.0 0.0 1.0))

(defn translation
  ([t]
     (make 1.0 0.0 0.0 (aget t 0)
           0.0 1.0 0.0 (aget t 1)
           0.0 0.0 1.0 (aget t 2)
           0.0 0.0 0.0 1.0))
  ([x y z]
     (make 1.0 0.0 0.0 x
           0.0 1.0 0.0 y
           0.0 0.0 1.0 z
           0.0 0.0 0.0 1.0)))

(defn scaling [s]
  (make s   0.0 0.0 0.0
        0.0 s   0.0 0.0
        0.0 0.0 s   0.0
        0.0 0.0 0.0 1.0))

(defn x-rotation [angle]
  (let [sin (js/Math.sin angle)
        cos (js/Math.cos angle)]
    (make 1.0 0.0 0.0     0.0
          0.0 cos (- sin) 0.0
          0.0 sin cos     0.0
          0.0 0.0 0.0     1.0)))

(defn y-rotation [angle]
  (let [sin (js/Math.sin angle)
        cos (js/Math.cos angle)]
    (make cos     0.0 sin 0.0
          0.0     1.0 0.0 0.0
          (- sin) 0.0 cos 0.0
          0.0     0.0 0.0 1.0)))

(defn z-rotation [angle]
  (let [sin (js/Math.sin angle)
        cos (js/Math.cos angle)]
    (make cos (- sin) 0.0 0.0
          sin cos     0.0 0.0
          0.0 0.0     1.0 0.0
          0.0 0.0     0.0 1.0)))

(defn projection [fov width height near far]
  (let [ratio     (/ width height)
        d         (/ 1 (js/Math.tan (clojure.core/* fov 0.5)))
        far-near  (- far near)
        far+near  (+ far near)
        dfn       (clojure.core/* 2 far near)]
    (make (/ d ratio) 0 0 0
          0 d 0 0
          0 0 (/ far+near far-near) (- (/ dfn far-near))
          0 0 1 0)))

(defn from-quaternion [q]
  (let [w2 (clojure.core/* (aget q 0) (aget q 0))
        x2 (clojure.core/* (aget q 1) (aget q 1))
        y2 (clojure.core/* (aget q 2) (aget q 2))
        z2 (clojure.core/* (aget q 3) (aget q 3))
        xy (clojure.core/* 2 (aget q 1) (aget q 2))
        zw (clojure.core/* 2 (aget q 3) (aget q 0))
        xz (clojure.core/* 2 (aget q 1) (aget q 3))
        yw (clojure.core/* 2 (aget q 2) (aget q 0))
        xw (clojure.core/* 2 (aget q 1) (aget q 0))
        yz (clojure.core/* 2 (aget q 2) (aget q 3))]
    (make (- (+ w2 x2) y2 z2) (- xy zw)               (+ xz yw)           0
          (+ xy zw)           (+ (- w2 x2) (- y2 z2)) (- yz xw)           0
          (- xz yw)           (+ yz xw)               (+ (- w2 x2 y2) z2) 0
          0           0       0                                           1)))

(defn ->rotation [m]
  (let [res (js/Float32Array. m)]
    (aset res 3 0.0)
    (aset res 7 0.0)
    (aset res 11 0.0)
    (aset res 15 1.0)
    res))

(defn ->translation [m]
  (vec/vec3 (aget m 3) (aget m 7) (aget m 11)))

(defn transpose [m]
  (let [clone (js/Float32Array. m)]
    (loop [y 0]
      (when (< y 3)
        (loop [x (+ y 1)]
          (when (< x 4)
            (let [upper (+ x (clojure.core/* y 4))
                  lower (+ y (clojure.core/* x 4))]
              (aset clone upper (aget m lower))
              (aset clone lower (aget m upper)))
            (recur (inc x))))
        (recur (inc y))))
     clone))

(defn det [m]
  (mac/det 4 m))

(defn *
  [l r]
  (let [clone (js/Float32Array. l)]
    (loop [row 0]
      (when (< row (.-length l))
        (let [r1 (+ row 1)
              r2 (+ row 2)
              r3 (+ row 3)
              v0 (aget l row)
              v1 (aget l r1)
              v2 (aget l r2)
              v3 (aget l r3)]
          (aset clone row
                (+ (clojure.core/* v0 (aget r 0))
                   (clojure.core/* v1 (aget r 4))
                   (clojure.core/* v2 (aget r 8))
                   (clojure.core/* v3 (aget r 12))))
          (aset clone r1
                (+ (clojure.core/* v0 (aget r 1))
                   (clojure.core/* v1 (aget r 5))
                   (clojure.core/* v2 (aget r 9))
                   (clojure.core/* v3 (aget r 13))))
          (aset clone r2
                (+ (clojure.core/* v0 (aget r 2))
                   (clojure.core/* v1 (aget r 6))
                   (clojure.core/* v2 (aget r 10))
                   (clojure.core/* v3 (aget r 14))))
          (aset clone r3
                (+ (clojure.core/* v0 (aget r 3))
                   (clojure.core/* v1 (aget r 7))
                   (clojure.core/* v2 (aget r 11))
                   (clojure.core/* v3 (aget r 15)))))
        (recur (+ row 4))))
    clone))

(defn inverse [m]
  (* (mac/cofactors 4 m) (scaling (/ 1.0 (det m)))))

(defn normal-transform [m]
  (transpose (inverse m)))

;; A simple performance test
;;
;; (let [R (x-rotation 1.5)
;;       v (js/Float32Array. 4000000)]
;;   (.log js/console "Filling vertices")
;;   (dotimes [i 4000000]
;;     (aset v i 0.5))
;;   (.log js/console "Measuring time:")
;;   (set! *print-fn* #(.log js/console %))
;;   (time (* v R)))
