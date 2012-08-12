(ns webgl.geometry
  (:require [webgl.buffer :as buffer]))

(defn as-float32 [v]
  (js/Float32Array. v))

(defn as-uint16 [v]
  (js/Uint16Array. v))

(defprotocol AsBuffered
  (as-buffered [_]))

(defrecord BufferedGeometry [source vertices indices])

(defrecord Geometry [vertices indices]
  AsBuffered
  (as-buffered [this]
    (BufferedGeometry. this
      (buffer/make :array (as-float32 vertices))
      (buffer/make :index (as-uint16 indices)))))

(def triangle
  (Geometry. (array  0.0  0.1 0.0 1.0
                    -0.1 -0.1 0.0 1.0
                     0.1 -0.1 0.0 1.0)
             (array 0 1 2)))

(defn- concaterate [coll n trans]
  (->> coll
       (iterate trans)
       (take (+ 1 n))
       (apply concat)
       (into-array)))

(defn- trans-vertices [trans vertices]
  (let [clone (aclone vertices)]
    (dotimes [x (/ (.-length clone) 4)
              ]
      (trans clone x))
    clone))

(defn- cloned-indices [indices]
  (let [c (count indices)]
    (map (partial + c) indices)))

(defn clone [n trans in]
  (Geometry.
    (concaterate (:vertices in)
                 n
                 (partial trans-vertices trans))
    (concaterate (:indices in)
                 n
                 cloned-indices)))

(defn transform [trans in]
  (Geometry.
    (trans-vertices trans (:vertices in))
    (:indices in)))
