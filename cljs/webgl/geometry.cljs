(ns webgl.geometry)

(defrecord Geometry [vertices normals indices])

(defn num-triangles [geometry]
  (/ (.-length (:indices geometry)) 3))

(defn num-vertices [geometry]
  (/ (.-length (:vertices geometry)) 4))

(defn transform [geometry trans]
  (Geometry.
    (trans (:vertices geometry))
    (:normals geometry)
    (:indices geometry)))
