(ns webgl.models.operators.factory
  (:require-macros [webgl.models.operators.macros :as m]))

(def ids (atom 0))

(defn next-id []
  (let [id @ids]
    (swap! ids inc)
    id))

(defrecord OperatorType
  [name
   input-types
   result-type
   label
   operator-fn
   defaults])

(defrecord Operator
  [type id parent inputs])

(defmulti make (fn [type & rest] type))

(defn operator [type]
  (Operator. type (next-id) (atom nil) (atom (:defaults type))))

(def types
  (atom {:types       []
         :result-type {}}))

(defn add-type! [type]
  (swap! types
    (fn [types]
      (-> types
          (update-in [:types] conj type)
          (update-in [:result-type (:result-type type)] conj type)))))

(defn by [k index]
  (get-in @types [k index]))

(defn make-type [name input-types result-type label f defaults]
  (OperatorType. name input-types result-type label f defaults))

(m/defgeneric :unassigned []
  "Unassigned"
  []
  []
  nil)

(m/defgeneric :constant []
  "Constant<T>"
  []
  [value]
  (constantly value))
