(ns webgl.views.gl.constants
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
   :z-buffer     "DEPTH_BUFFER_BIT"

   ;; primitive types
   :triangles "TRIANGLES"

   ;; shader types
   :vertex   "VERTEX_SHADER"
   :fragment "FRAGMENT_SHADER"

   ;; winding order
   :cw
   :ccw

   ;; depth parameters
   :depth-func "DEPTH_FUNC"
   :less       "LESS"
   :greater    "GREATER"
   
   ;; flags
   :cull       "CULL_FACE"
   :depth-test "DEPTH_TEST"})

(defn get [context flag]
  (aget context (clojure.core/get flags flag)))
