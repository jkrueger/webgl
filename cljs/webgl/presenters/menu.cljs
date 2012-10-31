(ns webgl.presenters.menu
  (:require [webgl.models.menu  :as list.model]
            [webgl.views.list   :as list.view]
            [webgl.kit.rx       :as rx]
            [webgl.partials.key :as k])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(defrecord Presenter [model view])

(extend-protocol list.view/ListElement
  list.model/Entry
  (label [e]
    (list.model/label e))
  (icon [e]
    (k/labeled (list.model/key e) 28 28))
  list.model/Command
  (label [e]
    (list.model/label e))
  (icon [e]
    (k/labeled (list.model/key e) 28 28)))

(defn- set-menu [view]
  #(list.view/set-elements view (list.model/children %)))

(defn- register-model-events [model view]
  (rxm/on (:events model)
    list.model/reload (set-menu view)))

(defn present [model view]
  (let [presenter (Presenter. model view)]
    (register-model-events model view)
    presenter))

(defn show [presenter]
  (list.view/show (:view presenter)))

(defn hide [presenter]
  (list.view/hide (:view presenter)))
