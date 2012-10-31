(ns webgl.views.help
  (:require [jayq.core          :as jayq]
            [crate.core         :as crate]
            [webgl.kit.d3       :as d3]
            [webgl.partials.key :as key]))

(defrecord View [dom])

(def padding-right 24)

(defn- pos [selection a width]
  (-> selection
      (d3/css :top   "0px")
      (d3/css :left  (str a "px"))
      (d3/css :width (str width "px"))))

(defn- slide-out [view]
  (-> view
      (d3/select :.text)
      (d3/transition)
      (d3/duration 500)
      (d3/css :left (str "-" (d3/css view :width)))
      (d3/remove)))

(defn- slide-in [view txt]
  (let [width (d3/width view)]
    (-> view
        (d3/append :div)
        (d3/attr :class "text")
        (d3/css :position "absolute")
        (pos width (- width padding-right))
        (d3/html txt)
        (d3/transition)
        (d3/duration 500)
        (d3/css :left "0px"))))

(defn show-help [view txt]
  (slide-out (:dom view))
  (slide-in  (:dom view) txt))

(defn show-extended-button [view]
  (-> (:dom view)
      (d3/select :.keybox)
      (d3/css :opacity 0.0)
      (d3/css :display "block")
      (d3/transition)
      (d3/duration 500)
      (d3/css :opacity 1.0)))

(defn make [container]
  (let [dom (d3/select container)]
    (d3/append dom (key/labeled "Alt" 38 38))
    (View. dom)))
