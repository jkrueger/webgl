(ns webgl.kit.d3.tree)

(defn children [tree f]
  (.children tree f))

(defn nodes [tree root]
  (.nodes tree root))

(defn links [tree nodes]
  (.links tree nodes))

(defn size
  ([tree]
     (.size tree))
  ([tree x y]
     (.size tree (array x y))))

(defn layout [width height]
  (-> (js/d3.layout.tree)
      (size width height)))
