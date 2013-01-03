(ns webgl.kit.d3.fx
  (:require [webgl.kit.d3 :as d3]))

(defn- fade [value selection]
  (-> selection
      (d3/transition)
      (d3/css :opacity value)))

(def fade-in  (partial fade 1.0))
(def fade-out (partial fade 0.0))

(defn- scale [value transition]
  (-> transition
      (d3/css :-webkit-transform (str "scale(" value ")"))))

(def scale-in  (partial scale 1.0))
(def scale-out (partial scale 0.6))
