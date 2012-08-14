(ns webgl.vector)

(def make array)

(defn dot [l r]
  (+ (* (aget l 0) (aget r 0))
     (* (aget l 1) (aget r 1))
     (* (aget l 2) (aget r 2))
     (* (aget l 3) (aget r 3))))

(defn length2 [v]
  (dot v v))

(defn length [v]
  (js/Math.sqrt (length2 v)))