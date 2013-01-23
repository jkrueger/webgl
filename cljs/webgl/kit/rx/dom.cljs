(ns webgl.kit.rx.dom
  (:require [jayq.core              :as jayq]
            [webgl.kit.rx.protocols :as rx]))

(deftype EventSource [selector event]
  rx/Source
  (observe [this sink]
    (if sink
      (jayq/on (jayq/$ selector)
               event
               #(rx/event sink %))
      (jayq/off (jayq/$ selector) event))
    this))

(defn event-source [name selector]
  (EventSource. selector name))
