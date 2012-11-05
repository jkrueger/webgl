(ns webgl.geometry)

(defrecord Geometry [vertices normals indices])

(defn num-triangles [geometry]
  (/ (.-length (:indices geometry)) 3))

(defn num-vertices [geometry]
  (.-length (:vertices geometry)))

(defn transform [geometry trans]
  (Geometry.
    (trans (:vertices geometry))
    (:indices geometry)))
