(ns webgl.presenters.selection
  (:require [webgl.kit.rx           :as rx]
            [webgl.kit.rx.protocols :as rxp]
            [webgl.models.selection :as m]))

(def selected   ::selected)
(def deselected ::deselected)

(defrecord Presenter [model events]
  rxp/Sink
  (event [_ evt]
    (let [current (m/current model)]
      (when (not (= evt current))
        (when (m/selected? model)
          (rx/named-event events deselected current))
        (rx/named-event events selected evt)
        (m/select! model evt)))))

(defn present
  [model]
  (Presenter.
    model
    (rx/named-channels selected deselected)))

(def current   (comp m/current :model))
(def selected? (comp m/selected? :model))
