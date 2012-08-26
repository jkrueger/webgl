(ns webgl.matrix
  (:refer-clojure :exclude (identity * =)))

(def make (comp #(js/Float32Array. %) array))

(def identity
  (make 1.0 0.0 0.0 0.0
        0.0 1.0 0.0 0.0
        0.0 0.0 1.0 0.0
        0.0 0.0 0.0 1.0))

(defn translation [t]
  (make 1.0 0.0 0.0 (aget t 0)
        0.0 1.0 0.0 (aget t 1)
        0.0 0.0 1.0 (aget t 2)
        0.0 0.0 0.0 1.0))

(defn scaling [s]
  (make s   0.0 0.0 0.0
        0.0 s   0.0 0.0
        0.0 0.0 s   0.0
        0.0 0.0 0.0 s))

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
