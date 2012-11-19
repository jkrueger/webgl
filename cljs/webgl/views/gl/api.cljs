(ns webgl.views.gl.api
  (:require [webgl.views.gl.constants :as const]))

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

(defn flag [flag]
  (const/get *context* flag))

(defn make-program []
  (.createProgram *context*))

(defn make-shader [type]
  (.createShader *context* (const/get *context* type)))

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
  (.bindBuffer *context* (const/get *context* buffer-type) id))

(defn buffer-data [buffer-type data]
  (.bufferData *context* (const/get *context* buffer-type)
    data
    (const/get *context* :static)))

;;; attributes/uniforms

(defn attribute-location [program name]
  (.getAttribLocation *context* program name))

(defn vertex-attribute-pointer
  [location size data-type normalized? stride offset]
  (.vertexAttribPointer *context*
    location
    size (const/get *context* data-type)
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
  (.clear *context* (const/get *context* buffer-type)))

(defn draw-arrays [primitive-type offset n]
  (.drawArrays *context* (const/get *context* primitive-type) offset n))

(defn draw-elements [primitive-type n data-type offset]
  (.drawElements *context*
    (const/get *context* primitive-type)
    n
    (const/get *context* data-type)
    offset))

;; flags

(defn enable [flag]
  (.enable *context* (const/get *context* flag)))

(defn disable [flag]
  (.disable *context* (const/get *context* flag)))

(def error->str
  {0      "No Error"
   0x0500 "Invalid Enum"
   0x0501 "Invalid Value"
   0x0502 "Invalid Operation"
   0x0505 "Out Of Memory"})

(defn error []
  (error->str (.getError *context*)))
