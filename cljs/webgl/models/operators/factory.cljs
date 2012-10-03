(ns webgl.models.operators.factory)

(defrecord Operator
  [operator-fn
   inputs
   name
   label
   result-type])

(defn operator
  ([name result-type inputs f label]
     (Operator. f (atom inputs) name label result-type)))

(defmulti make (fn [type & rest] type))

(defmethod make :unassigned
  [_ result-type]
  (operator :unassigned result-type nil :unassigned "Unassigned value"))

(defmethod make :constant
  [_ result-type value label]
  (operator :constant result-type nil (constantly value) label))
