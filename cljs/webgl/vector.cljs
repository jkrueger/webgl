(ns webgl.vector
  (:refer-clojure :exclude (* + -)))

(def make array)

(defn point3 [a b c]
  (array a b c 1))

(defn vec3 [a b c]
  (array a b c 0))

(defn vec3->quat [w v]
  (array w (aget v 0) (aget v 1) (aget v 2) (aget v 3)))

(defn scale [v s]
  (make (clojure.core/* s (aget v 0))
        (clojure.core/* s (aget v 1))
        (clojure.core/* s (aget v 2))
        (clojure.core/* s (aget v 3))))

(defn - [l r]
  (make (clojure.core/- (aget l 0)  (aget r 0))
        (clojure.core/- (aget l 1)  (aget r 1))
        (clojure.core/- (aget l 2)  (aget r 2))
        (clojure.core/- (aget l 3)  (aget r 3))))

(defn + [l r]
  (make (clojure.core/+ (aget l 0)  (aget r 0))
        (clojure.core/+ (aget l 1)  (aget r 1))
        (clojure.core/+ (aget l 2)  (aget r 2))
        (clojure.core/+ (aget l 3)  (aget r 3))))

(defn += [l r]
  (aset l 0 (clojure.core/+ (aget l 0)  (aget r 0)))
  (aset l 1 (clojure.core/+ (aget l 1)  (aget r 1)))
  (aset l 2 (clojure.core/+ (aget l 2)  (aget r 2)))
  (aset l 3 (clojure.core/+ (aget l 3)  (aget r 3))))

(defn dot [l r]
  (clojure.core/+
    (clojure.core/* (aget l 0) (aget r 0))
    (clojure.core/* (aget l 1) (aget r 1))
    (clojure.core/* (aget l 2) (aget r 2))
    (clojure.core/* (aget l 3) (aget r 3))))

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

(defn- one-over-length [v]
  (let [l (length v)]
    (if (= l 0.0)
      1
      (/ 1.0 l))))

(defn normal [v]
  (scale v (one-over-length v)))

(defn normalize [v]
  (let [l (one-over-length v)]
    (aset v 0 (clojure.core/* l (aget v 0)))
    (aset v 1 (clojure.core/* l (aget v 1)))
    (aset v 2 (clojure.core/* l (aget v 2)))
    (aset v 3 (clojure.core/* l (aget v 3)))))

(defn quat* [a b]
  (let [wa (aget a 0)
        wb (aget b 0)
        va (vec3 (aget a 1) (aget a 2) (aget a 3))
        vb (vec3 (aget b 1) (aget b 2) (aget b 3))]
    (vec3->quat
      (clojure.core/- (clojure.core/* wa wb) (dot va vb))
      (+ (cross va vb)
         (+ (scale vb wa) (scale va wb))))))
