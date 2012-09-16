(ns webgl.kit.workflow.macros)

(defmacro defworkflow [n]
  `(def ~n (webgl.kit.workflow/make)))

(defmacro defstate
  ([flow id]
     `(defstate ~flow ~id []))
  ([flow id args & body]
     `(swap! ~flow
             assoc-in
             [:states ~id]
             { :id ~id :in (fn ~args ~@body) })))

(defmacro deftrans
  ([flow from event target]
     `(deftrans ~flow ~from ~event ~target []))
  ([flow from event target args & body]
     `(swap! ~flow
             assoc-in
             [:transitions ~event ~from ~target]
             (fn ~args ~@body))))
