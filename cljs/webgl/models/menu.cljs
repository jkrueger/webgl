(ns webgl.models.menu
  (:refer-clojure :exclude (select key))
  (:require [webgl.models.menu.protocols :as p]
            [webgl.kit.command           :as cmd]
            [webgl.kit.rx                :as rx]))

(def reload ::reload)

(def MenuModel p/MenuModel)
(def MenuEntry p/MenuEntry)

;; menu functions
(def leave    p/leave)
(def set!     p/set!)
(def select   p/select)

;; entry functions
(def children p/children)
(def key      p/key)
(def label    p/label)

(defrecord Entry [label event children]
  p/MenuEntry
  (label [_]
    label)
  (key [_]
    (js/String.fromCharCode event))
  (children [_]
    (vals children)))

(defrecord Command [label event command]
  p/MenuEntry
  (label [_]
    label)
  (key [_]
    (js/String.fromCharCode event))
  (children [_]))

(defn- ->entry [model path]
  (->> path
       (interleave (repeat :children))
       (get-in @(:menu model))))

(defmulti handle-entry
  (fn [_ entry _]
    (type entry)))

(defmethod handle-entry :default [model entry path])

(defmethod handle-entry Entry [model entry path]
  (reset! (:path model) path))

(defmethod handle-entry Command [model entry path]
  (cmd/exec (:command entry))
  (p/leave model))

(defrecord Model [menu path events]
  p/MenuModel
  (set! [model menu]
    (reset! (:menu model) menu)
    (p/leave model)
    (rx/named-event events reload menu))
  (select [model entry]
    (let [path (conj @(:path model) entry)]
      (handle-entry model (->entry model path) path)))
  (leave [model]
    (reset! (:path model) [])))

(defn make []
  (Model. (atom {}) (atom []) (rx/named-channels reload)))

(defn zipmap-entries [entries]
  (zipmap (map :event entries) entries))

(defn entry [label event & children]
  (Entry.
    label event
    (zipmap-entries children)))

(defn command [label event command]
  (Command. label event command))

(defn root [& children]
  (Entry. nil nil
    (zipmap-entries children)))
