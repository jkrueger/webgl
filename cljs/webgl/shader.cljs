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
  (bind [_ program frame]))

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

(deftype Attribute [type name printer value-fn]
  Declare
  (declare [_]
    (printer "attribute"
             (type-name type)
             name))
  Compile
  (compile [_]
    name)
  Bind
  (bind [_ prog frame]
    (let [location (api/attribute-location prog name)
          value    (value-fn frame)]
      (to-attribute type location value))))

(deftype Uniform [type name printer value-fn]
  Declare
  (declare [_]
    (printer "uniform"
             (type-name type)
             name))
  Compile
  (compile [_]
    name)
  Bind
  (bind [_ prog frame]
    (let [location (api/uniform-location prog name)
          value    (value-fn frame)]
      (to-uniform type location value))))

(defn attribute [type value-fn]
  (Attribute.
    type
    (code/identifier :attribute)
    code/attribute-printer
    value-fn))

(defn uniform [type value-fn]
  (Uniform.
    type
    (code/identifier :uniform)
    code/attribute-printer
    value-fn))

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
      (compile out)))
  Bind
  (bind [_ prog frame]
    (doseq [attribute attributes]
      (bind attribute prog frame))))

(defn shader [attributes out]
  (Shader. attributes out))
