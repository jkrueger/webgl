(ns webgl.api
  (:require [webgl.constants :as const]))

(def ^:dynamic *context* nil)

(defn make-context [canvas]
  (.getContext canvas "experimental-webgl"))

(defn context []
  *context*)

(defn canvas []
  (.-canvas *context*))

(defn with-context [context f & args]
  (binding [*context* context]
    (apply f args)))

(defn make-program []
  (.createProgram *context*))

(defn make-shader [type]
  (.createShader *context* (const/get type)))

(defn set-source [shader code]
  (.shaderSource *context* shader code))

(defn compile-shader [shader]
  (.compileShader *context* shader))

(defn attach-shader [program shader]
  (.attachShader *context* program shader))

(defn link-program [program]
  (.linkProgram *context* program))

(defn use-program [program]
  (.useProgram *context* program))

(defn make-buffer []
  (.createBuffer *context*))

(defn bind-buffer [buffer-type id]
  (.bindBuffer *context* (const/get buffer-type) id))

(defn buffer-data [buffer-type data]
  (.bufferData *context* (const/get buffer-type)
    (js/Float32Array. data)
    (const/get :static)))

;;; attributes/uniforms

(defn attribute-location [program name]
  (.getAttribLocation *context* program name))

(defn vertex-attribute-pointer
  [location size data-type normalized? stride offset]
  (.vertexAttribPointer *context*
    location
    size (const/get data-type)
    normalized? stride offset))

(defn enable-vertex-attribute-array [location]
  (.enableVertexAttribArray *context* location))

(defn uniform-location [program name]
  (.getUniformLocation *context* program name))

(defn uniform-matrix [location value]
  (.uniformMatrix4fv *context*
    location false (js/Float32Array. value)))

;;; rendering

(defn clear-color [r g b a]
  (.clearColor *context* r g b a))

(defn clear [buffer-type]
  (.clear *context* (const/get buffer-type)))

(defn draw-arrays [primitive-type offset n]
  (.drawArrays *context* (const/get primitive-type) offset n))
