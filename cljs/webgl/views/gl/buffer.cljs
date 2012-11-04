(ns webgl.views.gl.buffer
  (:require [webgl.geometry           :as geo]
            [webgl.views.gl.api       :as api]
            [webgl.views.gl.protocols :as p]))

(defrecord Buffer [type id])

(defn bind [buffer]
  (api/bind-buffer (:type buffer) (:id buffer)))

(defn set-data [buffer data]
  (api/buffer-data (:type buffer) data))

(defn make
  ([buffer-type]
     (let [id     (api/make-buffer)
           buffer (Buffer. buffer-type id)]
       buffer))
  ([buffer-type content]
     (let [buffer (make buffer-type)]
       (bind buffer)
       (api/buffer-data buffer-type content)
       buffer)))

(defrecord BufferedGeometry [vertices indices])

(def num-triangles :num-triangles)
(def num-vertices  :num-vertices)

(defn update-buffer [buffered geometry]
  (bind (:vertices buffered))
  (set-data (:vertices buffered) (:vertices geometry))
  (bind (:indices buffered))
  (set-data (:indices  buffered) (:indices geometry))
  (assoc buffered
    num-triangles (geo/num-triangles geometry)
    num-vertices  (geo/num-vertices  geometry)))

(extend-protocol p/Factory
  webgl.geometry.Geometry
  (factory [this]
    (-> (BufferedGeometry. (make :array) (make :index))
        (update-buffer this))))
