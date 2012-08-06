(ns webgl.shader
  (:refer-clojure :exclude [*])
  (:require [webgl.buffers     :as buffer]
            [webgl.constants   :as const]
            [webgl.shader.code :as code]))

(defprotocol GLSLType
  (type-name [_]))

(defprotocol Declare
  (declare [_]))

(defprotocol Compile
  (compile [_]))

(defprotocol Bind
  (bind [_ gl program val]))

(defprotocol ToAttribute
  (to-attribute [_ gl location val]))

(defprotocol ToUniform
  (to-uniform [_ gl location val]))

(defprotocol AttributeBinder
  (attribute-binder [_]))

(extend-protocol AttributeBinder
  buffer/Buffer
  (attribute-binder [this]
    (fn [gl location size val]
      (doto gl
        (buffer/bind this)
        (.vertexAttribPointer location size (const/get :float) false 0 0)
        (.enableVertexAttribArray location)))))

(deftype Vec4 []
  GLSLType
  (type-name [_]
    "vec4")
  ToAttribute
  (to-attribute [_ gl location val]
    (let [binder (attribute-binder val)]
      (binder gl location 3 val))))

(deftype Mat4 []
  GLSLType
  (type-name [_]
    "mat4")
  ToUniform
  (to-uniform [_ gl location val]
    (.uniformMatrix4fv gl
      location false (js/Float32Array. val))))

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
  (bind [_ gl prog val]
    (let [location (.getAttribLocation gl prog name)]
      (to-attribute type gl location val))))

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
  (bind [_ gl prog val]
    (let [location (.getUniformLocation gl prog name)]
      (to-uniform type gl location val))))

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
