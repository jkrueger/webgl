(ns webgl.models.selection)

(defprotocol Selection
  (clear! [_])
  (selected? [_])
  (select! [_ x])
  (current [_]))

(extend-protocol Selection
  Atom
  (clear! [a]
    (reset! a nil))
  (selected? [a]
    (boolean @a))
  (select! [a x]
    (reset! a x))
  (current [a]
    (deref a)))
