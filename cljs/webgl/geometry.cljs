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
      (buffer/make :array vertices)
      (buffer/make :index indices))))

(def triangle
  (Geometry. (-> (array  0.0  0.1 0.0 1.0
                        -0.1 -0.1 0.0 1.0
                         0.1 -0.1 0.0 1.0)
                 (as-float32))
             (-> (array 0 1 2)
                 (as-uint16))))

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

(defn- cloned-indices [indices]
  (let [c   (.-length indices)
        out (js/Uint16Array. c)]
    (dotimes [x c]
      (aset out
            x
            (+ (aget indices x)
               c)))
    out))

(defn clone [n trans in]
  (Geometry.
    (aiterate (:vertices in)
              n
              trans)
    (aiterate (:indices in)
              n
              cloned-indices)))

(defn transform [trans in]
  (Geometry.
    (trans (:vertices in))
    (:indices in)))
