(ns webgl.presenters.properties
  (:require [webgl.kit.rx                   :as rx]
            [webgl.models.operators         :as model]
            [webgl.models.operators.factory :as model.factory]
            [webgl.views.form               :as form])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(extend-protocol form/Field
  model/Operator
  (field-label [op] (model/label op))
  (field-type  [op] (model/result-type op))
  (field-attrs [op]
    (case (model/result-type op)
      :integer {:step 1}
      :float   {:step 0.05}
      :angle   {:step 0.05 :min (- js/Math.PI) :max js/Math.PI}
      :vector  {:step 0.05}))
  (field-value [op] ((model/operator op))))

(defrecord Presenter [view operator])

(defn- clone [operator value]
  (model.factory/make
    :constant
    (model/result-type operator)
    {:label (model/label operator)}
    value))

(defn- change-constant [presenter model]
  (fn [evt]
    (let [parent   @(:operator presenter)
          operator (:data evt)
          index    (:index operator)]
      (.log js/console "VALUE" (:value evt))
      (model/set-child model
        parent
        index
        (clone operator (:value evt))))))

(defn register-view-events [presenter view model]
  (rxm/on (:events view)
    form/field-changed (change-constant presenter model)))

(defn present [model view]
  (let [presenter (Presenter. view (atom nil))]
    (register-view-events presenter view model)
    presenter))

(defn- property? [op]
  (= (model/op-name op) :constant))

(defn- ->properties [operator]
  (->> operator
       (model/children)
       (map-indexed #(assoc %2 :index %1))
       (filter property?)))

(defn show-operator [presenter operator]
  (reset! (:operator presenter) operator)
  (form/set! (:view presenter) (->properties operator)))
