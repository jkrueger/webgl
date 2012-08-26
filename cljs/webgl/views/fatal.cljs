(ns webgl.views.fatal
  (:require [crate.core :as crate]
            [jayq.core  :as jayq]))

(defn make [msg]
  (->> [:div.error [:div msg]]
       (crate/html)))
