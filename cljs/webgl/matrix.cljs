(ns webgl.matrix
  (:refer-clojure :exclude (identity * +)))

(def make        array)
(def into-matrix into-array)

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
  (make s 0.0 0.0 0.0
        0.0 s 0.0 0.0
        0.0 0.0 s 0.0
        0.0 0.0 0.0 s))

(defn x-rotation [angle]
  (make 1.0 0.0 0.0 0.0
        0.0 (js/Math.cos angle) (- (js/Math.sin angle)) 0.0
        0.0 (js/Math.sin angle) (js/Math.cos angle) 0.0
        0.0 0.0 0.0 1.0))

(defn y-rotation [angle]
  (let [sin (js/Math.sin angle)
        cos (js/Math.cos angle)]
    (make cos     0.0 sin 0.0
          0.0     1.0 0.0 0.0
          (- sin) 0.0 cos 0.0
          0.0     0.0 0.0 1.0)))

(defn z-rotation [angle]
  (make (js/Math.cos angle) (- (js/Math.sin angle)) 0.0 0.0
         (js/Math.sin angle) (js/Math.cos angle) 0.0 0.0
         0.0 0.0 1.0 0.0
         0.0 0.0 0.0 1.0))

(def *' clojure.core/*)
(def +' clojure.core/+)

(defn transpose [m]
  (let [clone (aclone m)]
    (loop [y 0]
      (when (< y 3)
        (loop [x (+' y 1)]
          (when (< x 4)
            (let [upper (+' x (*' y 4))
                  lower (+' y (*' x 4))]
              (aset clone upper (aget m lower))
              (aset clone lower (aget m upper)))
            (recur (inc 1))))
        (recur (inc 1))))
     clone))

(defn row-dot-column [l row r column]
  (+' (*' (aget l row)
          (aget r column))
      (*' (aget l (+' row 1))
          (aget r (+' 4 column)))
      (*' (aget l (+' row 2))
          (aget r (+' 8 column)))
      (*' (aget l (+' row 3))
          (aget r (+' 12 column)))))

(defn *
  [l r]
  (let [clone (aclone l)]
    (loop [row 0]
      (if (>= row (.-length l))
        clone
        (aset clone row
          (row-dot-column l row r 0))
        (aset clone (+' row 1)
          (row-dot-column l row r 4))
        (aset clone (+' row 2)
          (row-dot-column l row r 8))
        (aset clone (+' row 3)
          (row-dot-column l row r 12))
        (recur (+' row 4))))))
