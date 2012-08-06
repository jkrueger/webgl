(ns webgl.matrix)

(defn rotation [z]
  (fn [frame]
    (let [z (z frame)]
      (array (js/Math.cos z) (- (js/Math.sin z)) 0.0 0.0
             (js/Math.sin z) (js/Math.cos z) 0.0 0.0
             0.0 0.0 1.0 0.0
             0.0 0.0 0.0 1.0))))
