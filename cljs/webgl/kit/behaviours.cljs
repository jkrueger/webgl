(ns webgl.kit.behaviours
  (:require [webgl.kit.rx :as rx]))

;;; container view behaviours

(defprotocol Contained
  (resize-to-container [_]))

(defn keep-resized [contained]
  (rx/observe (rx/event-source :resize js/window)
    #(resize-to-container contained)))
