(ns webgl.views.tree
  (:require [jayq.core    :as jayq]
            [webgl.kit.rx :as rx]))

(defn select
  ([parent selector]
     (.select parent (name selector)))
  ([selector]
     (select js/d3 (name selector))))

(defn select*
  ([parent selector]
     (.selectAll parent (name selector)))
  ([selector]
     (select* js/d3 (name selector))))

(defn attr
  ([selection type]
     (.attr selection (name type)))
  ([selection type value]
     (.attr selection (name type) value)))

(defn append [selection type & attrs]
  (let [appended (.append selection (name type))]
    (doseq [attribute (partition 2 attrs)]
      (apply attr appended attribute))
    appended))

(defn insert [selection type before]
  (.insert selection (name type) (name before)))

(defn css
  ([selection type]
     (.style selection (name type)))
  ([selection type value]
     (.style selection (name type) value)))

(defn data [selection data]
  (.data selection data))

(defn entered [selection]
  (.enter selection))

(defn tree-layout []
  (js/d3.layout.tree))

(defn children [tree f]
  (.children tree f))

(defn size [tree x y]
  (.size tree (array x y)))

(declare resize-to-container)

(def test
  (js-obj "name" "test" "children"
          (array (js-obj "name" "test2" "children" (array))
                 (js-obj "name" "test3" "children" (array)))))

(defn transform [dx dy]
  (str "translate(" dx ", " dy ")"))

(defn resize [selection width height]
  (-> selection
      (attr :width  width)
      (attr :height height)))

(defn- layout [svg width height]
  (let [width    (js/parseInt width)
        height   (js/parseInt height)
        tree     (-> (tree-layout) (size height width))
        nodes    (.nodes tree test)
        vertices (-> (select* svg :g.node)
                     (data nodes))
        links    (-> (select* svg :path.link)
                     (data (.links tree nodes)))
        diagonal (-> (js/d3.svg.diagonal)
                     (.projection
                       (fn [d]
                         (array (aget d "y") (aget d "x")))))]
    ;; resize svg element...
    (resize svg width height)
    ;; ...and relayout nodes
    (-> (entered vertices)
        (append :g :class "node")
        (append :circle :r 4.5))
    (-> vertices
        (attr :transform
          (fn [d]
            (transform (aget d "y") (aget d "x")))))
    (-> (entered links)
        (insert :path :g)
        (attr :class "link")
        (attr :d diagonal)
        )
    ))

(defn make [container]
  (let [container (select container)
        svg       (append container :svg)]
  (append svg :g)
  (layout svg (css container :width) (css container :height))
  (resize-to-container container svg)))

(defn- resize-to-container
  "Creates a new observer for the window object
   that is triggered on resize events and adjusts the
   viewport accordingly."
  [container svg]
  (-> (rx/event-source :resize js/window)
      (rx/observe
        (fn []
          (layout svg
            (css container :width)
            (css container :height))))))
