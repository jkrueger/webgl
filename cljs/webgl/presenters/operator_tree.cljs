(ns webgl.presenters.operator-tree
  (:require [webgl.kit.rx           :as rx]
            [webgl.matrix           :as mat]
            [webgl.models.operators :as model]
            [webgl.views.gl         :as display])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(defrecord Presenter
    [view
     currently-displayed])

(defn display [presenter op]
  (let [view (:view presenter)]
    (reset! (:currently-displayed presenter) op)
    (->> op
         (model/eval)
         (display/set-geometry view))))

(defn- should-update? [current op]
  current)

(defn update [presenter op]
  (let [view    (:view presenter)
        current @(:currently-displayed presenter)]
    (when (should-update? current op)
      (->> current
           (model/eval)
           (display/set-geometry view)))))

(defn- register-view-events [view presenter]
  (-> (rx/event-source :click (:dom view))
      (rx/observe
       (fn [_]
         (if (display/paused? view)
           (display/resume view)
           (display/pause view))))))

(defn- register-model-events [model presenter]
  (rxm/on (:events model)
    model/update #(update presenter %)))

(defn present [model view]
  (let [displayed (atom nil)
        presenter (Presenter. view displayed)]
    (register-view-events view presenter)
    (register-model-events model presenter)
    (display/start view)
    presenter))
