(ns webgl.views.tree
  (:require [webgl.kit.behaviours :as b]
            [webgl.kit.d3         :as d3]
            [webgl.kit.d3.tree    :as d3.tree]
            [webgl.kit.d3.svg     :as d3.svg]
            [webgl.kit.rx         :as rx]))

(def side-margin 18)

(def node-clicked ::node-clicked)

(defrecord View [root container svg events])

(defn tree-width [view]
  (- (d3/width (:svg view)) (* 2 side-margin)))

(defn tree-height [view]
  (d3/height (:svg view)))

(defn- translate [a]
  (str "translate(" (aget a 0) ", " (aget a 1) ")"))

(defn- axis-inversion
  "When used to create a diagonal this will transform
   a vertical tree view into a horizontal one"
  [d]
  (array (+ side-margin (aget d "y")) (aget d "x")))

(defn- position-nodes [selection]
  (d3/attr selection :transform (comp translate axis-inversion)))

(defn- position-edges [selection]
  (d3/attr selection :d (d3.svg/project axis-inversion)))

(defn- register-node-events [selection view]
  (d3/on selection :click
    #(this-as dom
      (rx/named-event (:events view) node-clicked dom))))

(defn- enter-vertices
  "New nodes have to be created (i.e. geometry has to be attached)"
  [view vertices]
  (-> (d3/entered vertices)
      (d3/append :g :class "node")
      (position-nodes)
      (d3/append :circle :r 4.5)
      (register-node-events view)))

(defn- enter-edges
  "New edges have to be created (i.e. geometry has to be attached)"
  [edges]
  (-> (d3/entered edges)
      (d3/insert :path :g)
      (d3/attr :class "link")
      (position-edges)))

(defn layout [view]
  (let [tree     (d3.tree/layout (tree-height view) (tree-width view))
        nodes    (d3.tree/nodes tree (:root view))
        links    (d3.tree/links tree nodes)
        vertices (-> (d3/select* (:svg view) :g.node)
                     (d3/data nodes))
        edges    (-> (d3/select* (:svg view) :path.link)
                     (d3/data links))]
    ;; add new nodes and edges
    (enter-vertices view vertices)
    (enter-edges edges)
    ;; move the existing nodes and edges to their new positions
    (position-nodes vertices)
    (position-edges edges)
    ;; remove everything else
    (-> vertices (d3/exited) (d3/remove))
    (-> edges (d3/exited) (d3/remove))))

(extend-protocol b/Contained
  View
  (resize-to-container [view]
    (-> (:svg view)
        (d3/attr :width (d3/width (:container view)))
        (d3/attr :height (d3/height (:container view))))
    (layout view)))

(defn- enable-keyboard [dom]
  (d3/attr dom :tabindex 0))

(defn- fire [events k]
  (rx/named-event events k js/d3.event.keyCode))

(defn- register-key-events [dom events]
  (-> dom
      (enable-keyboard)
      (d3/on :keydown #(fire events :keydown))))

(defn make [container]
  (let [container (d3/select container)
        svg       (d3/append container :svg)
        events    (rx/named-channels node-clicked :keydown)
        view      (View. (js-obj) container svg events)]
  (d3/append svg :g)
  (b/resize-to-container view)
  (register-key-events container events)
  view))

(defn set-root!
  "Set a new tree root and relayout the view"
  [view root]
  (set! (.-root view) root)
  (layout view)
  nil)

(defn clear
  "Remove all tree nodes and edges from the view"
  [view]
  (set-root! view (js-obj)))

(defn- resize-node [dom size]
  (-> (d3/select dom)
      (d3/transition)
      (d3/duration 500)
      (d3/attr :r size)))

(defn raise [view dom]
  (resize-node dom 9))

(defn lower [view dom]
  (resize-node dom 4.5))
