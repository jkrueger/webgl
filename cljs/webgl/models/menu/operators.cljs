(ns webgl.models.menu.operators
  (:require [webgl.models.menu           :as men]
            [webgl.models.menu.protocols :as p]
            [webgl.models.operators      :as ops]))

(defmulti operator->menu
  (fn [presenter op]
    (ops/result-type op)))

(defmulti operator->entries
  (fn [presenter op]
    (ops/op-name op)))

(defrecord Model
    [wrapped-model
     operator-model
     static-entries-fn
     events]
  p/MenuModel
  (set! [this operator]
    (p/set! wrapped-model (operator->menu this operator)))
  (select [_ entry]
    (p/select wrapped-model entry))
  (leave [_]
    (p/leave wrapped-model)))

(defn make [wrapped-model operator-model static-entries-fn]
  (Model.
    wrapped-model
    operator-model
    static-entries-fn
    (:events wrapped-model)))

(defn- discover-entries [model op filter-fn action-fn]
  (map-indexed
   (fn [i type]
     (men/command
       (:label type)
       (+ 68 i)
       #(action-fn (:operator-model model) op type)))
   (ops/discover-by
     :result-type (ops/result-type op)
     filter-fn)))

(defmethod operator->entries :default
  [model op]
  (discover-entries
    model
    op
    ops/transformer?
    ops/transform))

(defmethod operator->entries :unassigned
  [model op]
  (discover-entries
    model
    op
    ops/generator?
    ops/replace))

(defmethod operator->menu :geometry [model op]
  (let [static-entries (:static-entries-fn model)]
    (apply men/root
      (concat 
        (static-entries op) 
        (operator->entries model op)))))
