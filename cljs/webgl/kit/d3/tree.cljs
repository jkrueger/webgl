(ns webgl.kit.d3.tree)

(defn layout []
  (js/d3.layout.tree))

(defn children [tree f]
  (.children tree f))

(defn nodes [tree root]
  (.nodes tree root))

(defn links [tree nodes]
  (.link tree nodes))

(defn size [tree x y]
  (.size tree (array x y)))
