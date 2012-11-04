(ns webgl.models.operators.macros)

(defmacro defop [k input-types result-type label defaults args f]
  `(let [type# (webgl.models.operators.factory/make-type
                 ~k ~input-types ~result-type ~label ~f ~defaults)]
     (webgl.models.operators.factory/add-type! type#)
     (defmethod webgl.models.operators.factory/make ~k
       [ignore# & rest#]
       (let [~args rest#]
         (webgl.models.operators.factory/operator type#)))))

(defmacro defgeneric [k input-types label defaults args f]
  `(let [type# (webgl.models.operators.factory/make-type
                 ~k ~input-types nil ~label nil ~defaults)]
     (webgl.models.operators.factory/add-type! type#)
     (defmethod webgl.models.operators.factory/make ~k
       [ignore# actual-type# overrides# & rest#]
       (let [~args      rest#
             overrides# (assoc overrides#
                          :result-type actual-type#
                          :operator-fn ~f)
             wrapper#   (reify ~'ILookup
                          (~'-lookup [this# k#]
                            (-lookup this# k# nil))
                          (~'-lookup [this# k# else#]
                            (get (if (contains? overrides# k#)
                                   overrides#
                                   type#)
                                 k# else#)))]
         (webgl.models.operators.factory/operator wrapper#)))))
