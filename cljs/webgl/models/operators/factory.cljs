(ns webgl.models.operators.factory)

(def ids (atom 0))

(defn next-id []
  (let [id @ids]
    (swap! ids inc)
    id))

(defrecord Operator
  [parent
   operator-fn
   inputs
   name
   label
   result-type])

(defn operator
  ([name result-type inputs f label]
     (with-meta
       (Operator. (atom nil) f (atom inputs) name label result-type)
       {:id (next-id)})))

(defmulti make (fn [type & rest] type))

(defmethod make :unassigned
  [_ result-type]
  (operator :unassigned result-type nil :unassigned "Unassigned"))

(defmethod make :constant
  [_ result-type value label]
  (operator :constant result-type nil (constantly value) label))
