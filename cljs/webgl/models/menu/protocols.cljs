(ns webgl.models.menu.protocols
  (:refer-clojure :exclude (select key)))

(defprotocol MenuModel
  (set!   [_ menu])
  (select [_ entry])
  (leave  [_]))

(defprotocol MenuEntry
  (label    [_])
  (key      [_])
  (children [_]))
