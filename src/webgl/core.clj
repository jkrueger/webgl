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
    (util/include-js  "js/mxClient.js")]
   [:body
    [:div#wrapper
     [:canvas#gl {:width 1180 :height 950}]
     [:div#properties]
     [:div#operators {:class "base"}]]
    (util/javascript-tag "webgl.core.init()")]))

(defn start [& {:keys [port] :or {:port 8080}}]
  (server/start port {:mode :prod :ns 'core}))
