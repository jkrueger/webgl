(ns webgl.shader
  (:refer-clojure :exclude [*])
  (:require [webgl.api         :as api]
            [webgl.buffers     :as buffer]
            [webgl.shader.code :as code]))

(defprotocol GLSLType
  (type-name [_]))

(defprotocol Declare
  (declare [_]))

(defprotocol Compile
  (compile [_]))

(defprotocol Bind
  (bind [_ program val]))

(defprotocol ToAttribute
  (to-attribute [_ location val]))

(defprotocol ToUniform
  (to-uniform [_ location val]))

(defprotocol AttributeBinder
  (attribute-binder [_]))

(extend-protocol AttributeBinder
  buffer/Buffer
  (attribute-binder [this]
    (fn [location size val]
      (buffer/bind this)
      (api/vertex-attribute-pointer location
        size :float false 0 0)
      (api/enable-vertex-attribute-array location))))

(deftype Vec4 []
  GLSLType
  (type-name [_]
    "vec4")
  ToAttribute
  (to-attribute [_ location val]
    (let [binder (attribute-binder val)]
      (binder location 3 val))))

(deftype Mat4 []
  GLSLType
  (type-name [_]
    "mat4")
  ToUniform
  (to-uniform [_ location value]
    (api/uniform-matrix location value)))

(def vec4 (Vec4.))
(def mat4 (Mat4.))

(deftype Attribute [type name printer]
  Declare
  (declare [_]
    (printer "attribute"
             (type-name type)
             name))
  Compile
  (compile [_]
    name)
  Bind
  (bind [_ prog val]
    (let [location (api/attribute-location prog name)]
      (to-attribute type location val))))

(deftype Uniform [type name printer]
  Declare
  (declare [_]
    (printer "uniform"
             (type-name type)
             name))
  Compile
  (compile [_]
    name)
  Bind
  (bind [_ prog val]
    (let [location (api/uniform-location prog name)]
      (to-uniform type location val))))

(defn attribute [type]
  (Attribute.
    type
    (code/identifier :attribute)
    code/attribute-printer))

(defn uniform [type]
  (Uniform.
    type
    (code/identifier :uniform)
    code/attribute-printer))

(deftype Multiply [args]
  Compile
  (compile [_]
    (code/stars (map compile args))))

(defn * [& args]
  (Multiply. args))

(deftype Shader [attributes out]
  Compile
  (compile [_]
    (code/shader
      (map declare attributes)
      (compile out))))

(defn shader [attributes out]
  (Shader. attributes out))
