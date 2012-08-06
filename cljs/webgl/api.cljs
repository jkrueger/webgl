(ns webgl.api
  (:require [webgl.constants :as const]))

(def *context* nil)

(defn make-context [canvas]
  (.getContext canvas "experimental-webgl"))

(defn context []
  *context*)

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

(defn use-program [prog]
  (.useProgram *context* program))
