(ns webgl.kit.rx
  (:require [webgl.kit.rx.protocols :as p]
            [webgl.kit.rx.dom       :as d]))

(def observe p/observe)
(def event   p/event)

(extend-protocol p/Sink
  js/Function
  (event [f x]
    (f x)))

(deftype Channel [sinks]
  p/Source
  (observe [_ sink]
    (swap! sinks conj sink))
  p/Sink
  (event [_ x]
    (doseq [sink @sinks]
      (p/event sink x))))

(defn channel []
  (Channel. (atom [])))

;;; imported API from submodules

;; DOM API

(def event-source d/event-source)

;; ...

