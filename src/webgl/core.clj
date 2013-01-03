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
    (util/include-css "css/common.css")
    (util/javascript-tag "var CLOSURE_NO_DEPS = true;")
    (util/include-js  "http://code.jquery.com/jquery-1.7.2.min.js")
    (util/include-js  "http://d3js.org/d3.v2.js")
    (util/include-js  "js/webgl.js")
    (util/include-js  "js/webgl-utils.js")
    (util/include-js  "js/webgl-debug.js")]
   [:body
    [:div#wrapper
     [:div#left
      [:div#viewport]]
     [:div#right
      [:div#editor
       [:div#properties {:class "base"}
        [:div.content
         [:div.head "Properties"]]]
       [:div#assets {:class "base"}
        [:div.content
         [:div.head "Assets"]
         [:div.menu]]]
       [:div#tree {:class "base"}
        [:div]]]]]
    (util/javascript-tag "webgl.core.init()")]))

(defn start [& {:keys [port] :or {:port 8080}}]
  (server/start port {:mode :prod :ns 'core}))
