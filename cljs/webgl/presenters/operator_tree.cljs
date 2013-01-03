(ns webgl.presenters.operator-tree
  (:require [webgl.kit.d3           :as d3]
            [webgl.kit.rx           :as rx]
            [webgl.matrix           :as mat]
            [webgl.vector           :as vec]
            [webgl.models.operators :as model]
            [webgl.views.gl         :as display])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(defrecord Presenter
    [view
     currently-displayed
     drag])

(defn display [presenter op]
  (let [view (:view presenter)]
    (reset! (:currently-displayed presenter) op)
    (display/set-geometry view op)))

(defn- should-update? [current op]
  current)

(defn update [presenter op]
  (let [view    (:view presenter)
        current @(:currently-displayed presenter)]
    (when (should-update? current op)
      (display/set-geometry view current))))

(defn- z [x y]
  (let [t (+ (* x x) (* y y))]
    (if (<= t 0.5)
      (js/Math.sqrt (- 1 t))
      (/ 1 (js/Math.sqrt t)))))

(defn drag-view [presenter view evt]
  (let [[x y]           evt
        [last-x last-y] (:mouse @(:drag presenter))
        a               (vec/normal (vec/vec3 last-x last-y (z last-x last-y)))
        b               (vec/normal (vec/vec3 x y (z x y)))
        n               (vec/normal (vec/cross a b))
        angle           (* 0.5 (js/Math.acos (vec/dot a b)))
        q               (vec/vec3->quat
                          (js/Math.cos angle)
                          (vec/scale n (js/Math.sin angle)))
        Q               (if (nil? (:q @(:drag presenter)))
                          q
                          (-> (vec/quat* (:q @(:drag presenter)) q)
                              (vec/normal)))]
    (display/rotation view (mat/from-quaternion Q))
  (reset! (:drag presenter) {:mouse evt :q Q})))

(defn- ->coords [x view]
  (let [width  (display/width view)
        height (display/height view)]
    (rx/map x
      #(vector (/ (- (aget % "offsetX") (* 0.5 width))
                  width)
               (/ (- (aget % "offsetY") (* 0.5 height))
                  height)))))

(defn stop-drag [view evt]
  (-> (rx/event-source :mousemove (:dom view))
      (rx/observe nil)))

(defn start-drag [presenter view evt]
  (swap! (:drag presenter) assoc-in [:mouse] evt)
  ;; register mouse move handler
  (-> (rx/event-source :mousemove (:dom view))
      (->coords view)
      (rx/observe #(drag-view presenter view %)))
  ;; and release it on mouseup event
  (rx/observe (rx/event-source :mouseup (:dom view))
    #(stop-drag view %))
  (rx/observe (rx/event-source :mouseleave (:dom view))
    #(stop-drag view %)))

(defn- register-view-events [view presenter]
  (-> (rx/event-source :mousedown (:dom view))
      (->coords view)
      (rx/observe #(start-drag presenter view %))))

(defn- register-model-events [model presenter]
  (rxm/on (:events model)
    model/update #(update presenter %)))

(defn present [model view]
  (let [displayed (atom nil)
        presenter (Presenter. view displayed (atom {:mouse nil :q nil}))]
    (register-view-events view presenter)
    (register-model-events model presenter)
    (display/start view)
    presenter))
