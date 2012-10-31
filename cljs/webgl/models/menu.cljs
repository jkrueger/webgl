(ns webgl.models.menu
  (:refer-clojure :exclude (select))
  (:require [webgl.kit.command :as cmd]
            [webgl.kit.rx      :as rx]))

(def reload ::reload)

(defprotocol MenuModel
  (set!   [_ menu])
  (select [_ entry])
  (leave  [_]))

(defprotocol MenuEntry
  (label    [_])
  (key      [_])
  (children [_]))

(defrecord Entry [label event children]
  MenuEntry
  (label [_]
    label)
  (key [_]
    (js/String.fromCharCode event))
  (children [_]
    (vals children)))

(defrecord Command [label event command]
  MenuEntry
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
  (leave model))

(defrecord Model [menu path events]
  MenuModel
  (set! [model menu]
    (reset! (:menu model) menu)
    (leave model)
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
