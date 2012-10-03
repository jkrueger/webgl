(ns webgl.models.operators
  (:require [webgl.kit.rx                    :as rx]
            [webgl.kit.rx.protocols          :as rxp]
            [webgl.models.operators.factory  :as f]
            [webgl.models.operators.geometry :as geo]
            [webgl.models.operators.scalar   :as scalar]))

(def reload ::reload)
(def update ::update)

(defrecord Model [root events])

(defn make []
  (Model.
    nil
    (rx/named-channels reload update)))

(defn set! [model root]
  (set! (.-root model) root)
  (rx/named-event (:events model) reload root)
  nil)

;;; operator API

(defprotocol Operators
  (op-name     [_])
  (label       [_])
  (result-type [_])
  (operator    [_])
  (children    [_])
  (set-input   [_ n child]))

(def Operator f/Operator)

(extend-protocol Operators
  f/Operator
  (op-name [op]
    (:name op))
  (label [op]
    (:label op))
  (result-type [op]
    (:result-type op))
  (operator [op]
    (:operator-fn op))
  (children [op]
    @(:inputs op))
  (set-input [op n child]
    (swap! (:inputs op) assoc n child)))

(defn eval [op]
  (apply (operator op) (map eval (children op))))

(defn fire-update [model parent]
  (rx/named-event (:events model) update parent))

(defn set-child [model op n child]
  (set-input op n child)
  (fire-update model op))
