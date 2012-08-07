(ns webgl.buffers
  (:require [webgl.api       :as api]
            [webgl.constants :as const]))

(deftype Buffer [type id])

(defn bind [buffer]
  (api/bind-buffer (.-type buffer) (.-id buffer)))

(defn make [buffer-type content]
  (let [id        (api/make-buffer)
        buffer    (Buffer. buffer-type id)]
    (bind buffer)
    (api/buffer-data buffer-type content)
    buffer))

(def as-bindable constantly)
