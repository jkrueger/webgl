(ns webgl.kit.d3)

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
