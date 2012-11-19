(ns webgl.vector
  (:refer-clojure :exclude (* + -)))

(def make array)

(defn - [l r]
  (make (clojure.core/- (aget l 0)  (aget r 0))
        (clojure.core/- (aget l 1)  (aget r 1))
        (clojure.core/- (aget l 2)  (aget r 2))
        1.0
;;        (clojure.core/- (aget l 3)  (aget r 3))
        ))

(defn + [l r]
  (make (clojure.core/+ (aget l 0)  (aget r 0))
        (clojure.core/+ (aget l 1)  (aget r 1))
        (clojure.core/+ (aget l 2)  (aget r 2))
        1.0
;;        (clojure.core/+ (aget l 3)  (aget r 3))
        ))

(defn += [l r]
  (aset l 0 (clojure.core/+ (aget l 0)  (aget r 0)))
  (aset l 1 (clojure.core/+ (aget l 1)  (aget r 1)))
  (aset l 2 (clojure.core/+ (aget l 2)  (aget r 2)))
  1.0
;;  (aset l 3 (clojure.core/+ (aget l 3)  (aget r 3)))
  )

(defn dot [l r]
  (clojure.core/+
    (clojure.core/* (aget l 0) (aget r 0))
    (clojure.core/* (aget l 1) (aget r 1))
    (clojure.core/* (aget l 2) (aget r 2))
;;    (clojure.core/* (aget l 3) (aget r 3))
    ))

(def * dot)

(defn cross [l r]
  (make
   (clojure.core/- (clojure.core/* (aget l 1) (aget r 2))
                   (clojure.core/* (aget l 2) (aget r 1)))
   (clojure.core/- (clojure.core/* (aget l 2) (aget r 0))
                   (clojure.core/* (aget l 0) (aget r 2)))
   (clojure.core/- (clojure.core/* (aget l 0) (aget r 1))
                   (clojure.core/* (aget l 1) (aget r 0)))
   0.0))

(defn length2 [v]
  (dot v v))

(defn length [v]
  (js/Math.sqrt (length2 v)))

(defn normalize [v]
  (let [l (length v)]
    (if (= l 0.0)
      v
      (let [l (/ 1.0 l)]
        (aset v 0 (clojure.core/* l (aget v 0)))
        (aset v 1 (clojure.core/* l (aget v 1)))
        (aset v 2 (clojure.core/* l (aget v 2)))))))
