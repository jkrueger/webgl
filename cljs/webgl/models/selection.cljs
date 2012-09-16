(ns webgl.models.selection)

(defprotocol Selection
  (selected? [_])
  (select! [_ x])
  (current [_]))

(extend-protocol Selection
  Atom
  (selected? [a]
    (boolean @a))
  (select! [a x]
    (reset! a x))
  (current [a]
    (deref a)))
