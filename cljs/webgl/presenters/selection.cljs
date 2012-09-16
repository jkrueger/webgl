(ns webgl.presenters.selection
  (:require  [webgl.kit.rx           :as rx]
             [webgl.models.selection :as m]))

(defn present
  [model view & {:keys [on-select on-deselect]}]
  (let [ch (rx/channel)]
    ;; lower previous model
    (when on-deselect
      (-> (rx/when ch #(m/selected? model))
          (rx/observe #(on-deselect view (m/current model)))))
    ;; raise current model
    (when on-select
      (-> (rx/filter ch #(not (= % (m/current model))))
          (rx/observe #(on-select view %))))
    ;; remember previous model
    (rx/observe ch #(m/select! model %))
    ch))
