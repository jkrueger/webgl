(ns webgl.partials.key)

(defn labeled [s w h]
  (let [hw (/ w 1.3)
        hh (/ h 1.3)
        px (* 0.5 (- w hw))
        py (* 0.5 (- h hh))
        tx (* 0.4 w)
        ty (* 0.5 h)]
    [:div {:class "keybox"}
     [:svg {:width w :height h}
      [:defs
       [:linearGradient {:id "back"
                         :y2 "1"
                         :x2 "1"
                         :y1 "0"
                         :x1 "1"}
        [:stop {:stop-color "#d8d8d8" :offset "0"}]
        [:stop {:stop-color "#a3a3a3" :offset "1"}]]
       [:linearGradient {:id "front"
                         :y2 "1"
                         :x2 "1"
                         :y1 "1"
                         :x1 "0"}
        [:stop {:stop-color "#d7d7d7" :offset "0"}]
        [:stop {:stop-color "#e7e7e7" :offset "0.5"}]
        [:stop {:stop-color "#d7d7d7" :offset "1"}]]]
      [:g
       [:rect {:x "0" :y "0" :width (str w) :height (str h) :ry "5"
               :class "back"}]
       [:rect {:x (str px) :y (str py) :width (str hw) :height (str hh) :ry "4"
               :class "front"}]
       [:text {:dx (str tx) :dy (str ty) :text-anchor "middle"} s]]]]))
