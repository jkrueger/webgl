(ns webgl.editor)

(defn add-triangle [editor cell]
  (.log js/console "TEST")
  (let [template (-> editor (.-templates) (aget "triangle"))
        graph    (.-graph editor)
        model    (.-model graph)
        clone    (.cloneCell model template)
        parent   (.getDefaultParent graph)]
    (.beginUpdate model)
    (.add model parent clone)
    (.endUpdate model)))

(defn add-linear [editor cell]
  (let [template (-> editor (.-templates) (aget "linear"))
        graph    (.-graph editor)
        model    (.-model graph)
        clone    (.cloneCell model template)
        parent   (.getDefaultParent graph)]
    (.beginUpdate model)
    (.add model parent clone)
    (.insertEdge graph parent nil cell clone)
    (.endUpdate model)))

(defn load-config [path]
  (let [config (-> path (js/mxUtils.load) (.getDocumentElement))]
    (doto (js/mxEditor. config)
      (.addAction "triangle" add-triangle)
      (.addAction "linear"   add-linear))))
