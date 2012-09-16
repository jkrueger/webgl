(ns webgl.kit.rx.macros)

(defmacro on [source & cases]
  (let [source-sym (gensym "source")]
    `(let [~source-sym ~source]
       ~@(map
           (fn [[k sink]]
             `(-> (webgl.kit.rx/on* ~source-sym ~k)
                  (webgl.kit.rx/observe ~sink)))
           (partition 2 cases)))))
