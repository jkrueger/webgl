(ns webgl.views.tree
  (:require [webgl.kit.behaviours :as b]
            [webgl.kit.d3         :as d3]
            [webgl.kit.d3.tree    :as d3.tree]
            [webgl.kit.d3.svg     :as d3.svg]
            [webgl.kit.rx         :as rx]))

(def side-margin 18)

(def node-clicked ::node-clicked)

(defprotocol Node
  (label [_])
  (children [_])
  (style [_]))

(defprotocol Wrap
  (wrap [_]))

(defrecord View [root container svg events])

(defrecord NodeWrapper [wrapped])

(extend-protocol Wrap
  js/Object
  (wrap [o]
    (NodeWrapper. o))
  PersistentVector
  (wrap [v]
    (into-array (map wrap v)))
  nil
  (wrap [_]))

(def unwrap :wrapped)

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

(defn- node-class [d]
  (-> d (unwrap) (style)))

(defn- node-label [d]
  (-> d (unwrap) (label)))

(defn- has-children? [d]
  (boolean (.-children d)))

(defn- enter-vertices
  "New nodes have to be created (i.e. geometry has to be attached)"
  [view vertices]
  (let [node (-> (d3/entered vertices) (d3/append :g :class "node"))]
    (-> node
        (position-nodes))
    (-> node
        (d3/append :circle :r 4.5)
        (d3/attr :class node-class)
        (register-node-events view))
    (-> node
        (d3/append :text)
        (d3/attr :dx 0)
        (d3/attr :dy 24)
        (d3/attr :text-anchor #(if (has-children? %) "start" "end"))
        (d3/text node-label))
    node))

(defn- enter-edges
  "New edges have to be created (i.e. geometry has to be attached)"
  [edges]
  (-> (d3/entered edges)
      (d3/insert :path :g)
      (d3/attr :class "link")
      (position-edges)))

(defn make-layout [view]
  (let [tree (d3.tree/layout (tree-height view) (tree-width view))]
    (d3.tree/children tree (comp wrap children unwrap))
    tree))

(defn layout [view]
  (when (:root view)
    (let [tree     (make-layout view)
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
      (-> edges (d3/exited) (d3/remove)))))

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
        view      (View. nil container svg events)]
  (d3/append svg :g)
  (b/resize-to-container view)
  (register-key-events container events)
  view))

(defn set-root!
  "Set a new tree root and relayouts the view"
  [view root]
  (set! (.-root view) (wrap root))
  (layout view)
  nil)

(defn clear
  "Remove all tree nodes and edges from the view"
  [view]
  (set-root! view nil))

(defn- resize-node [dom size]
  (-> (d3/select dom)
      (d3/transition)
      (d3/duration 500)
      (d3/attr :r size)))

(defn raise [view dom]
  (resize-node dom 9))

(defn lower [view dom]
  (resize-node dom 4.5))

;;; tree node API

(defn node-data [node]
  (-> node
      (.-parentNode)
      (d3/select)
      (d3/datum)
      (unwrap)))
