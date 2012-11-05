(ns webgl.views.gl.shader
  (:refer-clojure :exclude [*])
  (:require [webgl.views.gl.api    :as api]
            [webgl.views.gl.buffer :as buffer]
            ;; [webgl.views.gl.shader.code :as code]
            ))

;; (defprotocol GLSLType
;;   (type-name [_]))

;; (defprotocol Declare
;;   (declare [_]))

;; (defprotocol Compile
;;   (compile [_]))

(defprotocol Bind
  (bind [_ program value]))

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
  ;; GLSLType
  ;; (type-name [_]
  ;;   "vec4")
  ToAttribute
  (to-attribute [_ location val]
    (let [binder (attribute-binder val)]
      (binder location 4 val))))

(deftype Mat4 []
  ;; GLSLType
  ;; (type-name [_]
  ;;   "mat4")
  ToUniform
  (to-uniform [_ location value]
    (api/uniform-matrix location value)))

(def vec4 (Vec4.))
(def mat4 (Mat4.))

(defn bind-attribute [prog type name value]
  (let [location (api/attribute-location prog name)]
    (to-attribute type location value)))

(defn bind-uniform [prog type name value]
  (let [location (api/uniform-location prog name)]
    (to-uniform type location value)))

(deftype Interface [type name binder]
  ;; Declare
  ;; (declare [_]
  ;;   (printer qualifier (type-name type) name))
  ;; Compile
  ;; (compile [_]
  ;;   name)
  Bind
  (bind [_ prog value]
    (binder prog type name value)))

(deftype Channels [channels] 
  ;; ILookup
  ;; (-lookup [this k]
  ;;   (-lookup this k nil))
  ;; (-lookup [this k else]
  ;;   (get channels k else))
  ;; Declare
  ;; (declare [_]
  ;;   (->> channels
  ;;        (map (comp declare second))
  ;;        (code/lines)))
  ;; Compile
  ;; (compile [_] "")
  Bind
  (bind [_ prog value]
    (doseq [[k attribute] channels]
      (bind attribute prog (get value k)))))

(defn attribute [type name]
  (Interface. type name bind-attribute))

(defn uniform [type name]
  (Interface. type name bind-uniform))

;; (def varying [type]
;;   (Interface.
;;    "varying"
;;     type
;;     (code/identifier :varying)
;;     code/attribute-printer
;;     nil))

(defn channels [& kvs]
  (Channels. (apply hash-map kvs)))

;; (defn ins [& kvs]
;;   (apply channels attribute kvs))

;; (defn outs [& kvs]
;;   (apply channels varying kvs))

;; (deftype Multiply [args]
;;   Compile
;;   (compile [_]
;;     (code/stars (map compile args))))

;; (deftype Assign [var expr]
;;   Compile
;;   (compile [_]
;;     (code/= (compile var) (compile expr))))

;; (deftype Statement [stmt]
;;   Compile
;;   (compile [_]
;;     (code/statement stmt)))

;; (defn * [& args]
;;   (Multiply. args))

;; (defn out [var expr]
;;   (Statement. (Assign. var expr)))

;; (deftype Shader [attributes stmts]
;;   Compile
;;   (compile [_]
;;     (code/shader
;;       (map declare attributes)
;;       (map compile stmts))))

;; (defn shader [attributes & stmts]
;;   (Shader. attributes stmts))
