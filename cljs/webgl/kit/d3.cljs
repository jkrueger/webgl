(ns webgl.kit.d3
  (:refer-clojure :exclude (remove)))

(defn- selector->name [selector]
  (if (keyword? selector)
    (name selector)
    selector))

(defn select
  ([parent selector]
     (.select parent (selector->name selector)))
  ([selector]
     (select js/d3 selector)))

(defn select*
  ([parent selector]
     (.selectAll parent (selector->name selector)))
  ([selector]
     (select* js/d3 selector)))

(defn attr
  ([selection]
     (.attr selection))
  ([selection type]
     (.attr selection (name type)))
  ([selection type value]
     (.attr selection (name type) value)))

(defn attr* [selection & kvs]
  (doseq [[k v] (partition 2 kvs)]
    (attr selection k v))
  selection)

(defn insert [selection type before]
  (.insert selection (name type) (name before)))

(defn remove [selection]
  (.remove selection))

(defn css
  ([selection type]
     (.style selection (name type)))
  ([selection type value]
     (.style selection (name type) value)))

(defn width [selection]
  (js/parseInt (css selection :width)))

(defn height [selection]
  (js/parseInt (css selection :height)))

(defn text [selection text]
  (.text selection text))

(defn html [selection text]
  (.html selection text))

(defprotocol Append
  (append-impl [_ selection]))

(defn- handle-attrs [selection v]
  (let [sec (second v)]
    (if (map? sec)
      (do
        (apply attr* selection (apply concat sec))
        (nnext v))
      (next v))))

(extend-protocol Append
  js/String
  (append-impl [k selection]
    (.append selection k))
  PersistentVector
  (append-impl [v selection]
    (let [res (-> (first v) (selector->name) (append-impl selection))
          ns  (handle-attrs res v)]
      (doseq [n ns]
        (if (vector? n)
          (append-impl n res)
          (text res n)))
      res)))

(defn append [selection element]
  (append-impl (selector->name element) selection))

(defn data
  ([selection data]
     (.data selection data))
  ([selection data key-fn]
     (.data selection data key-fn)))

(defn datum
  ([selection]
     (.datum selection))
  ([selection value]
     (.datum selection value)))

(defn entered [selection]
  (.enter selection))

(defn exited [selection]
  (.exit selection))

(defn each [selection f]
  (.each selection f))

(defn call [selection f & args]
  ;; small hack to get apply working. memfn in
  ;; cljs seems to be broken atm, so we have to
  ;; work around it
  (.call selection #(apply f % args)))

(defn on [selection event listener]
  (.on selection (name event) listener))

(defn transition [selection]
  (.transition selection))

(defn duration [transition t]
  (.duration transition t))

(defn delay [transition t]
  (.delay transition t))

(defn- ->name [arg]
  (if (keyword? arg)
    (name arg)
    arg))

(defn ease [transition easing & args]
  (.ease transition (apply js/d3.ease (name easing) (map ->name args))))
