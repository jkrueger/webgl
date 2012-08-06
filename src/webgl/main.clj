(ns webgl.main
  (:require [webgl.core :as core]))

(defn -main [port]
  (core/start :port (Integer. port)))
