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
  (make (js/Math.cos angle) 0.0 (js/Math.sin angle) 0.0
        0.0 1.0 0.0 0.0
         (- (js/Math.sin angle)) 0.0 (js/Math.cos angle) 0.0
         0.0 0.0 0.0 1.0))

(defn z-rotation [angle]
  (make (js/Math.cos angle) (- (js/Math.sin angle)) 0.0 0.0
         (js/Math.sin angle) (js/Math.cos angle) 0.0 0.0
         0.0 0.0 1.0 0.0
         0.0 0.0 0.0 1.0))

(def *' clojure.core/*)
(def +' clojure.core/+)

(defn dot [l r]
  (+' (*' (aget l 0) (aget r 0))
      (*' (aget l 1) (aget r 1))
      (*' (aget l 2) (aget r 2))
      (*' (aget l 3) (aget r 3))))

(defn length2 [v]
  (dot v v))

(defn length [v]
  (js/Math.sqrt (length2 v)))

(defn row [m row]
  (let [row (*' row 4)]
    (make (aget m row)
          (aget m (+' row 1))
          (aget m (+' row 2))
          (aget m (+' row 3)))))

(defn column [m col]
  (make (aget m col)
        (aget m (+' col 4))
        (aget m (+' col 8))
        (aget m (+' col 12))))

(defn * [l r]
  (into-matrix
    (for [x (range 4)
          y (range 4)]
      (dot (column l y) (row r x)))))

(defn ** [l offset r]
  (let [in (row l offset)]
    (dotimes [x 4]
      (aset l (+' (*' offset 4)
                  x)
            (dot in (row r x))))))
