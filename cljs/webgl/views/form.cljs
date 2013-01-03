(ns webgl.views.form
  (:require [crate.core      :as crate]
            [webgl.kit.rx    :as rx]
            [webgl.kit.d3    :as d3]
            [webgl.kit.d3.fx :as fx]
            [webgl.vector    :as vec]
            [jayq.core       :as jayq]))

(def field-changed ::field-changed)

(defprotocol Field
  (field-attrs [_])
  (field-label [_])
  (field-type  [_])
  (field-value [_]))

(def field-tag (comp :tag meta))

(defrecord View [container events empty-message])

(defmulti value-partial (fn [d] (field-type d)))

(defmethod value-partial :default [d]
  [:td {:class "form scalar"}
   [:input (merge {:class "value"
                   :type "number"
                   :value (field-value d)}
                  (field-attrs d))]])

(defmethod value-partial :vector [d]
  (let [v     (field-value d)
        attrs (merge {:class "value" :type "number"}
                     (field-attrs d))]
    [:td {:class "form"}
     [:table {:class "vector" :style "width:100%;table-layout:fixed;border-spacing:0px"}
      [:tr
       [:td {:class "vector"} [:input (assoc attrs :value (aget v 0))]]
       [:td {:class "vector"} [:input (assoc attrs :value (aget v 1))]]
       [:td {:class "vector"} [:input (assoc attrs :value (aget v 2))]]]]]))

;; TODO: should really be a multi method like abstraction

(defn- fire-scalar-change [dom events data index]
  (let [value (.-valueAsNumber (.get dom 0))]
    (rx/named-event events field-changed
      {:data  data
       :index index
       :value value})))

(defn- fire-vector-change [dom events data index]
  (let [siblings (-> dom
                     (jayq/parent)
                     (jayq/parent)
                     (jayq/children)
                     (jayq/children :input))
        vector   (-> siblings
                     (.map #(this-as input
                              (.-valueAsNumber input)))
                     (.get))]
    (rx/named-event events field-changed
      {:data  data
       :index index
       :value vector})))

(defn- fire-change [dom events data index]
  (let [parent (jayq/parent dom)]
    (condp #(jayq/has-class %2 %1) parent
      "scalar" (fire-scalar-change dom events data index)
      "vector" (fire-vector-change dom events data index)
      nil)))

(defn- register-input-events [form events]
  (d3/on (d3/select* form "table *.value") :click
    (fn [d i]
      (let [input   js/d3.event.target
            $input  (jayq/$ input)
            $body   (jayq/$ "body")]
        ;; show input widget
        (-> $input
            (jayq/on :change #(fire-change $input events d i))
            (jayq/on :mousedown
              (fn [evt]
                (jayq/css $input :-webkit-user-select "none")
                (let [last     (atom (aget evt "offsetX"))]
                  (jayq/on $input :mousemove
                    (fn [evt]
                      (let [x    (aget evt "offsetX")
                            relx (- x @last)]
                        (if (< relx 0)
                          (.stepDown input)
                          (.stepUp input))
                        (jayq/trigger $input :change)
                        (reset! last x)))))
                (jayq/on $body :mouseup
                  (fn []
                    (jayq/off $input :mousemove)
                    (jayq/off $body  :mouseup)
                    (jayq/css $input :-webkit-user-select "text")
                    (jayq/val $input (jayq/val $input)))))))))))

(defn- add-value [d]
  (this-as this
    (let [tr (d3/select this)]
      (d3/append tr [:td {:class "form"} [:p field-label]])
      (d3/append tr (value-partial d)))))

(defn- add-field [selection]
  (-> selection
      (d3/append :tr)
      (d3/attr :class "form")
      (d3/each add-value)))

(defn- add [view inputs]
  (let [container (:container view)
        form      (-> container
                      (d3/append :table)
                      (d3/attr :class "form")
                      (d3/css :opacity 0.0))
        fields    (-> (d3/select* form :tr)
                      (d3/data (into-array inputs))
                      (d3/entered)
                      (add-field))]
    (register-input-events container (:events view))
    form))

(defn- empty-message [view]
  (-> (:container view)
      (d3/append :p)
      (d3/attr :class "form")
      (d3/text (:empty-message view))))

(defn- add-when-not-empty [view inputs]
  (if (= 0 (count inputs))
    (empty-message view)
    (add view inputs)))

(defn clear [view]
  (-> (:container view)
      (d3/select* :.form)
      (d3/remove)))

(defn set! [view inputs]
  (clear view)
  (-> (add-when-not-empty view inputs)
      (fx/fade-in)
      (d3/duration 300)))

(defn make [container empty-message]
  (let [container (d3/select container)
        events    (rx/named-channels field-changed)]
    (View. container events empty-message)))
