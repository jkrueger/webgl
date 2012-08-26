(ns webgl.kit.rx.protocols)

(defprotocol Source
  (observe [_ sink]))

(defprotocol Sink
  (event [_ x]))