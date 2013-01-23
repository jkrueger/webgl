(ns webgl.views.tree
  (:require [webgl.kit.behaviours :as b]
            [webgl.kit.d3         :as d3]
            [webgl.kit.d3.tree    :as d3.tree]
            [webgl.kit.d3.svg     :as d3.svg]
            [webgl.kit.rx         :as rx]))

(def side-margin 24)
(def node-clicked ::node-clicked)

;;; tree node API

(defprotocol Wrap
  (wrap [_]))

(defrecord NodeWrapper [wrapped])

(extend-protocol Wrap
  PersistentVector
  (wrap [v]
    (into-array (map wrap v)))
  nil
  (wrap [_]))

(def unwrap :wrapped)

(defprotocol Node
  (id [_])
  (label [_])
  (children [_])
  (style [_]))

(defn node-data [node]
  (-> node
      (d3/select)
      (d3/datum)
      (unwrap)))

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
  (d3/attr selection
    :transform
    (comp translate axis-inversion)))

(defn- position-edges [selection]
  (d3/attr selection :d (d3.svg/project axis-inversion)))

(defn- fire [view event data]
  (rx/named-event (:events view) event data))

(defn- register-node-events [selection view]
  (d3/on selection :click
    #(this-as dom
       (->> (.-parentNode dom)
            (node-data)
            (fire view node-clicked)))))

(defn- node-id [d]
  (-> d (unwrap) (id)))

(defn- node-class [d]
  (-> d (unwrap) (style)))

(defn- node-label [d]
  (-> d (unwrap) (label)))

(defn- has-children? [d]
  (boolean (.-children d)))

(def anchor-middle    (constantly "middle"))
(def anchor-leafs-end #(if (has-children? %) "start" "end"))

(defn pick-anchor-fn [nodes]
  (if (= 1 (count nodes))
    anchor-middle
    anchor-leafs-end))

(defn- enter-vertices
  "New nodes have to be created (i.e. geometry has to be attached)"
  [view vertices anchor-fn]
  (let [node (-> (d3/entered vertices)
                 (d3/append :g)
                 (d3/attr :class "node")
                 (d3/attr :nid #(str "node" (node-id %))))]
    (-> node
        (position-nodes))
    (-> node
        (d3/append :circle)
        (d3/attr :r 4.5)
        (d3/attr :class node-class)
        (register-node-events view))
    (-> node
        (d3/append :text)
        (d3/attr :dx 0)
        (d3/attr :dy 24)
        (d3/attr :text-anchor anchor-fn)
        (d3/text node-label))
    node))

(defn- enter-edges
  "New edges have to be created (i.e. geometry has to be attached)"
  [edges]
  (-> (d3/entered edges)
      (d3/insert :path :g)
      (d3/attr :class "link")
      (position-edges)))

(def ->children (comp wrap children unwrap))

(defn- make-layout [view]
  (let [tree (d3.tree/layout (tree-height view) (tree-width view))]
    (d3.tree/children tree ->children)
    tree))

(defn- offset-single-root [view selection]
  (let [width (if (= 1 (count selection))
                (tree-width view)
                0)]
    (-> (d3/select (:svg view) :g.root)
        (d3/attr :transform (translate (array (* 0.5 width) 0))))))

(defn layout [view]
  (when (:root view)
    (let [tree     (make-layout view)
          nodes    (d3.tree/nodes tree (:root view))
          links    (d3.tree/links tree nodes)
          vertices (-> (d3/select (:svg view) :g.root)
                       (d3/select* :g.node)
                       (d3/data nodes node-id))
          edges    (-> (d3/select* (:svg view) :path.link)
                       (d3/data links))]
      (offset-single-root view nodes)
      ;; add new nodes and edges
      (enter-vertices view vertices (pick-anchor-fn nodes))
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

(defn make [container]
  (let [container (d3/select container)
        svg       (d3/append container :svg)
        events    (rx/named-channels node-clicked)
        view      (View. nil container svg events)]
  (-> (d3/append svg :g) (d3/attr :class "root"))
  (b/resize-to-container view)
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
  (-> dom
      (d3/transition)
      (d3/duration 500)
      (d3/attr :r size)))

(defn- nid [node]
  (str "g[nid=node" (id node) "]"))

(defn resize [view node size]
  (-> (d3/select (:svg view) (nid node))
      (d3/select :circle)
      (resize-node size)))

(defn raise [view node]
  (resize view node 9))

(defn lower [view node]
  (resize view node 4.5))
