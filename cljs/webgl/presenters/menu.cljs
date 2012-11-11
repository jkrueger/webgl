(ns webgl.presenters.menu
  (:require [webgl.models.menu      :as menu.model]
            [webgl.views.list       :as list.view]
            [webgl.kit.rx           :as rx]
            [webgl.partials.key     :as k])
  (:require-macros [webgl.kit.rx.macros :as rxm]))

(def display-requested   ::display-requested)
(def assign-requested    ::assign-requested)
(def transform-requested ::transform-requested)

(defrecord Presenter [model view events])

(extend-protocol list.view/ListElement
  menu.model/Entry
  (label [e]
    (menu.model/label e))
  (icon [e]
    (k/labeled (menu.model/key e) 28 28))
  menu.model/Command
  (label [e]
    (menu.model/label e))
  (icon [e]
    (k/labeled (menu.model/key e) 28 28)))

(defn- set-menu [view]
  #(list.view/set-elements view (menu.model/children %)))

(defn- register-model-events [model view]
  (rxm/on (:events model)
    menu.model/reload (set-menu view)))

(defn- make-channels []
  (rx/named-channels
    display-requested
    assign-requested
    transform-requested))

(defn present [model view]
  (let [presenter (Presenter. model view (make-channels))]
    (register-model-events model view)
    presenter))

(defn set! [presenter menu]
  (menu.model/set! (:model presenter) menu))

(defn show [presenter]
  (list.view/show (:view presenter)))

(defn hide [presenter]
  (list.view/hide (:view presenter)))
