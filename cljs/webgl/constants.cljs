(ns webgl.constants
  (:refer-clojure :exclude [get]))

(def flags
  {;; data types
   :float js/WebGLRenderingContext.FLOAT

   ;; buffer types
   :array  js/WebGLRenderingContext.ARRAY_BUFFER
   :index  js/WebGLRenderingContext.ELEMENT_ARRAY_BUFFER

   ;; buffer life times flags
   :static js/WebGLRenderingContext.STATIC_DRAW

   ;; buffer areas
   :color-buffer js/WebGLRenderingContext.COLOR_BUFFER_BIT

   ;; primitive types
   :triangles js/WebGLRenderingContext.TRIANGLES

   ;; shader types
   :vertex   js/WebGLRenderingContext.VERTEX_SHADER
   :fragment js/WebGLRenderingContext.FRAGMENT_SHADER})

(def get flags)

