(ns webgl.models.operators
  (:require [webgl.kit.rx           :as rx]
            [webgl.kit.rx.protocols :as rxp]))

(defrecord Model [operators connections channel]
  rxp/Source
  (observe [_ sink]
    ;; listen to model changes
    ))

(defn make []
  (Model. #{} [] (rx/channel)))

(defn add
  "Add a new operator to the model"
  [node]
  )

(defn connect
  "Connect two operators in the model making
   one the input of the other"
  [from to n]
  )

(defn disconnect
  "Disconnect an operator from another one.
   This will remove the operator from the list
   of external inputs of the target"
  [operator from]
  )
