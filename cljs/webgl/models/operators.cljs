(ns webgl.models.operators
  (:require [webgl.kit.rx           :as rx]
            [webgl.kit.rx.protocols :as rxp]))

(def reload ::reload)

(deftype Operator [name children])

(defrecord Model [root events])

(defn make []
  (Model.
    #{}
    (rx/named-channels reload)))

(defprotocol Load
  (load [operator-source]))

(extend-protocol Load
  Operator
  (load [root] root))

(defn set! [model operator-source]
  (let [root (load operator-source)]
    (set! (.-root model) root)
    (rx/named-event (:events model) reload root))
  nil)
