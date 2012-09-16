(ns webgl.kit.rx
  (:refer-clojure :exclude (case filter map when))
  (:require [webgl.kit.rx.protocols :as p]
            [webgl.kit.rx.dom       :as d]))

(def observe p/observe)
(def event   p/event)

(extend-protocol p/Sink
  js/Function
  (event [f x]
    (f x))
  nil
  (event [_ x]))

(deftype Pipe []
  p/Source
  (observe [_ sink]
    (reify p/Sink
      (event [_ evt]
        (p/event sink evt)))))

(defn pipe []
  (Pipe.))

(deftype Channel [sinks]
  p/Source
  (observe [this sink]
    (swap! sinks conj sink)
    sink)
  p/Sink
  (event [_ x]
    (doseq [sink @sinks]
      (p/event sink x))))

(defn channel []
  (Channel. (atom [])))

(defrecord NamedObservables [observable-map])

(defn named-observables [f & names]
  (NamedObservables. (into {} (clojure.core/map #(vector % (f %)) names))))

(defn named-channels [& names]
  (apply named-observables (fn [_] (channel)) names))

(defn on* [source k]
  (get (:observable-map source) k))

(defn fire [source sink k]
  (observe source (on* sink k)))

(defn named-event [channels k evt]
  (event (on* channels k) evt))

(defn map-sink [sink f]
  (reify p/Sink
    (event [_ x]
      (p/event sink (f x)))))

(defn map [source f]
  (reify
    p/Source
    (observe [this sink]
      (p/observe source (map-sink sink f)))))

(defn filter-sink [sink p]
  (reify p/Sink
    (event [_ x]
      (clojure.core/when (p x)
        (event sink x)))))

(defn filter [source p]
  (reify
   p/Source
   (observe [this sink]
     (p/observe source (filter-sink sink p)))))

(def when filter)

(defn case [source & cases]
  (let [m (apply hash-map cases)]
    (observe source
      (fn [evt]
        (when-let [sink (get m (:type evt evt))]
          (event sink evt))))))

;;; imported API from submodules

;; DOM API

(def event-source d/event-source)

;; ...

