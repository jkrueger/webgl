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
   [:div {:class "value"} (field-value d)]])

(defmethod value-partial :vector [d]
  (let [v (field-value d)]
    [:td {:class "form"}
     [:table {:class "vector" :style "width:100%;table-layout:fixed;border-spacing:0px"}
      [:tr
       [:td {:class "vector"} [:div {:class "value"} (aget v 0)]]
       [:td {:class "vector"} [:div {:class "value"} (aget v 1)]]
       [:td {:class "vector"} [:div {:class "value"} (aget v 2)]]]]]))

;; TODO: should really be a multi method like abstraction

(defn- fire-scalar-change [dom events data index]
  (rx/named-event events field-changed
    {:data data :index index :value (js/parseFloat (jayq/text dom))}))

(defn- fire-vector-change [dom events data index]
  (let [siblings (-> dom
                     (jayq/parent)
                     (jayq/parent)
                     (jayq/children)
                     (jayq/children :div))
        ->value  #(this-as value (-> (jayq/$ value) (jayq/text) (js/parseFloat)))
        vector   (-> siblings (.map ->value) (.get))]
    (rx/named-event events field-changed
      {:data data :index index :value vector})))

(defn- fire-change [dom events data index]
  (let [parent (jayq/parent dom)]
    (condp #(jayq/has-class %2 %1) parent
      "scalar" (fire-scalar-change dom events data index)
      "vector" (fire-vector-change dom events data index)
      nil)))

(defn- make-input [value d]
  (crate/html
   [:input (merge
            {:type   "number"
             :value  (jayq/text value)
             :step   0.05
             :ondrag false}
            (field-attrs d))]))

(defn- register-input-events [form events]
  (d3/on (d3/select* form "table *.value") :click
    (fn [d i]
      (let [value   (jayq/$ js/d3.event.target)
            input   (make-input value d)
            $input  (jayq/$ input)
            display (jayq/css value :display)
            $window (jayq/$ js/window)]
        ;; show input widget
        (-> $input
            (jayq/width  (jayq/width value))
            (jayq/height (jayq/height value))
            (jayq/insert-after value)
            (jayq/trigger :focus)
            (jayq/on :blur
              (fn []
                (jayq/css value :display display)
                (jayq/remove $input)))
            (jayq/on :change
              (fn []
                (jayq/text value (.-value input))
                (fire-change value events d i)))
            (jayq/on :mousedown
              (fn [evt]
                (jayq/css $input :-webkit-user-select "none")
                (let [last (atom (aget evt "offsetX"))]
                  (jayq/on $window :mousemove
                    (fn [evt]
                      (let [x    (aget evt "offsetX")
                            relx (- x @last)]
                        (if (< relx 0)
                          (.stepDown input)
                          (.stepUp input))
                        (jayq/trigger $input :change)
                        (reset! last x)))))
                (jayq/on $window :mouseup
                  (fn []
                    (jayq/off $window :mousemove)
                    (jayq/off $window :mouseup)
                    (jayq/css $input :-webkit-user-select "text")
                    (jayq/val $input (jayq/val $input)))))))
        ;; hide display widget for now
        (jayq/css value :display "none")))))

;; (defn- add-attrs [selection]
;;   (d3/each selection
;;     (fn [d]
;;       (this-as dom
;;         (apply d3/attr*
;;                (d3/select dom)
;;                (field-attrs d))))))

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

  ;; [:td {:class "form"} [:p field-label]]
  ;; [:td {:class "form"} (value)]

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
