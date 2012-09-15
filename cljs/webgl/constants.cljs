(ns webgl.constants
  (:refer-clojure :exclude [get]))

(def flags
  {;; data types
   :float          "FLOAT"
   :unsigned-short "UNSIGNED_SHORT"

   ;; buffer types
   :array  "ARRAY_BUFFER"
   :index  "ELEMENT_ARRAY_BUFFER"

   ;; buffer life times flags
   :static "STATIC_DRAW"

   ;; buffer areas
   :color-buffer "COLOR_BUFFER_BIT"

   ;; primitive types
   :triangles "TRIANGLES"

   ;; shader types
   :vertex   "VERTEX_SHADER"
   :fragment "FRAGMENT_SHADER"})

(defn get [context flag]
  (aget context (get flags flag)))
