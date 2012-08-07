(ns webgl.matrix)

(defn x-rotation [angle]
  (fn [frame]
    (let [angle (angle frame)]
      (array 1.0 0.0 0.0 0.0
             0.0 (js/Math.cos angle) (- (js/Math.sin angle)) 0.0
             0.0 (js/Math.sin angle) (js/Math.cos angle) 0.0
             0.0 0.0 0.0 1.0))))

(defn y-rotation [angle]
  (fn [frame]
    (let [angle (angle frame)]
      (array (js/Math.cos angle) 0.0 (js/Math.sin angle) 0.0
             0.0 1.0 0.0 0.0
             (- (js/Math.sin angle)) 0.0 (js/Math.cos angle) 0.0
             0.0 0.0 0.0 1.0))))

(defn z-rotation [angle]
  (fn [frame]
    (let [angle (angle frame)]
      (array (js/Math.cos angle) (- (js/Math.sin angle)) 0.0 0.0
             (js/Math.sin angle) (js/Math.cos angle) 0.0 0.0
             0.0 0.0 1.0 0.0
             0.0 0.0 0.0 1.0))))
