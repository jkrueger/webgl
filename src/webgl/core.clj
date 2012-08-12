(ns webgl.core
  (:require [noir.core           :as noir]
            [noir.server         :as server]
            [hiccup.core         :as html]
            [hiccup.page-helpers :as util]))

(noir/defpage "/webgl" {}
  (util/html5
   [:head
    [:meta {:charset "UTF-8"}]
    [:title "webgl"]
    (util/javascript-tag "var CLOSURE_NO_DEPS = true;")
    (util/include-js  "http://code.jquery.com/jquery-1.7.2.min.js")
    (util/include-js  "js/webgl.js")
    (util/include-js  "js/webgl-utils.js")
    (util/include-js  "js/webgl-debug.js")
    ;; (util/include-js  "http://www.diagram.ly/client?version=1.9.2.5")
    ]
   [:body
    [:canvas#gl {:width 500 :height 500}]
    (util/javascript-tag "webgl.core.init()")]))

(defn start [& {:keys [port] :or {:port 8080}}]
  (server/start port {:mode :prod :ns 'core}))
