(ns webgl.kit.command)

(defprotocol Command
  (exec-impl [_ args]))

(extend-protocol Command
  js/Function
  (exec-impl [f args]
    (apply f args)))

(defn exec [command & args]
  (exec-impl command args))
