(ns webgl.program
  (:require [webgl.api :as api]))

(def make api/make-program)

(defn attach! [program shader-type code]
  (let [shader (api/make-shader shader-type)]
    (api/set-source shader code)
    (api/compile-shader shader)
    (api/attach-shader program shader)))

(def link! api/link-program)
(def use!  api/use-program)
