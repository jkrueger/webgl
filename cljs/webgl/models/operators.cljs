(ns webgl.models.operators
  (:refer-clojure :exclude (replace))
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

(defn set-root! [model root]
  (set! (.-root model) root)
  (rx/named-event (:events model) reload root)
  nil)

;;; operator API

(defprotocol Operators
  (id          [_])
  (op-name     [_])
  (input-types [_])
  (result-type [_])
  (label       [_])
  (operator    [_])
  (parent      [_])
  (children    [_])
  (set-input   [_ n child]))

(def Operator f/Operator)

(extend-protocol Operators
  f/Operator
  (id [op]
    (:id op))
  (op-name [op]
    (-> op :type :name))
  (result-type [op]
    (-> op :type :result-type))
  (input-types [op]
    (-> op :type :input-types))
  (label [op]
    (-> op :type :label))
  (operator [op]
    (-> op :type :operator-fn))
  (parent [op]
    @(:parent op))
  (children [op]
    @(:inputs op))
  (set-input [op n child]
    (reset! (:parent child) op)
    (swap! (:inputs op) assoc n child)))

;;; type API

(defn discover-by [k idx filter-fn]
  (->> (f/by k idx)
       (filter filter-fn)))

(defn input-count [type]
  (count (:input-types type)))

(defn unassigned-count [type]
  (->> (:defaults type)
       (filter #(= (op-name %) :unassinged))
       (count)))

(defn eval [op]
  (apply (operator op) (map eval (children op))))

(defn fire-update [model parent]
  (rx/named-event (:events model) update parent))

(defn set-child [model op n child]
  (set-input op n child)
  (fire-update model op))

(defn- find-child-indexed [op child]
  (->> (children op)
       (map-indexed list)
       (filter #(= % child))
       (first)))

(defn replace [model old new]
  (if-let [owner (parent old)]
    (when-let [indexed-child (find-child-indexed old new)]
      (apply set-input owner indexed-child)
      (fire-update model owner))
    (set-root! model new)))
