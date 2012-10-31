(ns webgl.views.list
  (:require [webgl.kit.d3 :as d3]))

(defrecord View [dom])

(defprotocol ListElement
  (label [_])
  (icon  [_]))

(defn- append-icon [d]
  (this-as dom
    (-> (d3/select dom)
        (d3/append (icon d)))))

(defn set-elements [view elements]
  (let [li      (-> (:dom view)
                    (d3/select :ul)
                    (d3/select* :li)
                    (d3/data (into-array elements) label))
        entered (-> li
                    (d3/entered)
                    (d3/append :li))]
    (-> entered
        (d3/each append-icon))
    (-> entered
        (d3/append :span)
        (d3/text label))
    (-> li
        (d3/exited)
        (d3/remove))))

(defn make [container]
  (let [container (d3/select container)]
    (-> container
        (d3/append :ul))
    (View. container)))

(defn show [view]
  (-> (:dom view)
      (d3/select :ul)
      (d3/transition)
      (d3/css :opacity "1")))

(defn hide [view]
  (-> (:dom view)
      (d3/select :ul)
      (d3/transition)
      (d3/css :opacity "0")))
