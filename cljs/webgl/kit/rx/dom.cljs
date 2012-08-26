(ns webgl.kit.rx.dom
  (:require [jayq.core              :as jayq]
            [webgl.kit.rx.protocols :as rx]))

(deftype EventSource [selector event]
  rx/Source
  (observe [this sink]
    (-> (jayq/$ selector)
        (jayq/on event #(rx/event sink %)))
    this))

(defn event-source [name selector]
  (EventSource. selector name))
