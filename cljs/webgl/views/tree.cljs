(ns webgl.views.tree
  (:require [jayq.core         :as jayq]
            [webgl.kit.d3      :as d3]
            [webgl.kit.d3.tree :as d3.tree]
            [webgl.kit.d3.svg  :as d3.svg]
            [webgl.kit.rx      :as rx]))

(declare resize-to-container)

(def test
  (js-obj "name" "test" "children"
          (array (js-obj "name" "test2" "children" (array))
                 (js-obj "name" "test3" "children" (array)))))

(defn transform [dx dy]
  (str "translate(" dx ", " dy ")"))

(defn resize [selection width height]
  (-> selection
      (d3/attr :width  width)
      (d3/attr :height height)))

(defn- axis-inversion [d]
  (array (aget d "y") (aget d "x")))

(defn- layout [svg width height]
  (let [width    (js/parseInt width)
        height   (js/parseInt height)
        tree     (d3.tree/layout height width)
        nodes    (d3.tree/nodes tree test)
        links    (d3.tree/links tree nodes)
        vertices (-> (d3/select* svg :g.node)
                     (d3/data nodes))
        links    (-> (d3/select* svg :path.link)
                     (d3/data link))
        diagonal (d3.svg/project axis-inversion)]
    (resize svg width height)
    ;; new nodes have to be created
    (-> (d3/entered vertices)
        (d3/append :g :class "node")
        (d3/append :circle :r 4.5))
    ;; all nodes should be transformed
    (-> vertices
        (d3/attr :transform
          (fn [d]
            (transform (aget d "y") (aget d "x")))))
    ;; new edges have to be created
    (-> (d3/entered links)
        (d3/insert :path :g)
        (d3/attr :class "link"))
    ;; all edges should be transformed
    (-> links
        (d3/attr :d diagonal))))

(defn make [container]
  (let [container (d3/select container)
        svg       (d3/append container :svg)]
  (d3/append svg :g)
  (layout svg
    (d3/css container :width)
    (d3/css container :height))
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
            (d3/css container :width)
            (d3/css container :height))))))
