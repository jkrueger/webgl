(ns webgl.buffers
  (:require [webgl.constants :as const]))

(deftype Buffer [id type])

(defn bind [gl buffer]
  (.bindBuffer gl (.-type buffer) (.-id buffer)))

(defn make [gl buffer-type content]
  (let [type-flag (const/get buffer-type)
        id        (.createBuffer gl)
        buffer    (Buffer. id type-flag)]
    (doto gl
      (bind buffer)
      (.bufferData type-flag
                   (js/Float32Array. content)
                   (const/get :static)))
    buffer))
