(ns webgl.kit.d3.svg)

(defn diagonal []
  (js/d3.svg.diagonal))

(defn projection [diagonal f]
  (.projection diagonal f))

(defn project [f]
  (-> (diagonal) (projection f)))
