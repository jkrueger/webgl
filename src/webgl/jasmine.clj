(ns webgl.jasmine)

(defmacro describe [description & body]
  `(~'js/describe ~description
     (fn [] ~@body)))

(defmacro it [description body]
  `(~'js/it ~description
            ~body))

(defmacro expect [expected _ check]
  (let [checker-form (if (symbol? check)
                       (check)
                       check)
        checker-name (first checker-form)
        this-sym     (gensym "this")
        expected-sym (gensym "expected")]
     `(fn []
        (when-not (contains? #{'toBeTruthy 'toBeFalsy} '~checker-name)
          (~'this-as this#
            (~checker-name this#)))
        (. (~'js/expect ~expected)
           ~checker-form))))

(defmacro format-failure [msg]
  `(~'this-as this#
     (aset this# "message"
           (fn []
             ~msg))))

(defmacro defchecker [n args failure body]
  `(def ~n
     (fn [this#]
       (let [matchers# (~'js-obj)]
         (aset matchers#
               ~(name n)
               (fn [& rest#]
                 (~'this-as this-fn#
                   (let [~args    (cons (aget this-fn# "actual")
                                        rest#)
                         checker# (fn [] ~body)]
                     (format-failure ~failure)
                     (checker#)))))
         (.addMatchers
           this#
           matchers#)))))
