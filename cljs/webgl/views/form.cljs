(ns webgl.views.form
  (:require [webgl.kit.rx :as rx]
            [webgl.kit.d3 :as d3]))

(def field-changed ::field-changed)

(defprotocol Field
  (field-type  [_])
  (field-label [_])
  (field-value [_]))

(def field-tag (comp :tag meta))

(defrecord View [container events])

(defmulti format-value
  (fn [dom]
    (.-type dom)))

(defmethod format-value "text" [dom]
  (.-value dom))

(defmethod format-value "number" [dom]
  (.-valueAsNumber dom))

(defmethod format-value "range" [dom]
  (.-valueAsNumber dom))

(defn- fire [events k data index]
  (rx/named-event events k
    {:data  data
     :index index
     :value (format-value js/d3.event.target)}))

(defn- register-input-events [input events]
  (d3/on input :change
    #(fire events field-changed %1 %2)))

(defn- tag [inputs]
  (map #(vary-meta % assoc :tag (name (gensym "input")))
       inputs))

(defn- add-label [container]
  (-> container
      (d3/append :label)
      (d3/attr :class "form")
      (d3/attr :for   field-tag)
      (d3/text field-label)))

(defn- add-input [container events]
  (-> container
      (d3/append :input)
      (d3/attr :id    field-tag)
      (d3/attr :class "form")
      (d3/attr :type  field-type)
      (d3/attr :value field-value)
      (d3/attr :step  0.1)
      (register-input-events events)))

(defn- add-field [container view]
  (add-label container)
  (add-input container (:events view)))

(defn- add [view inputs]
  (let [container (:container view)
        form      (-> container (d3/append :ul) (d3/attr :class "form"))
        tagged    (into-array (tag inputs))]
    (-> (d3/select* form :li)
        (d3/data tagged)
        (d3/entered)
        (d3/append :li)
        (d3/attr :class "form")
        (d3/call add-field view))))

(defn clear [view]
  (-> (:container view)
      (d3/select* :*)
      (d3/remove)))

(defn set! [view inputs]
  (clear view)
  (add view inputs))

(defn make [container]
  (let [container (d3/select container)
        events    (rx/named-channels field-changed)]
    (View. container events)))