(ns webgl.views.gl.shader.code
  (:require [clojure.string :as str]))

(defn joiner [delimeter]
  (partial str/join delimeter))

(defn variadic [f]
  (comp f list))

(defn embracer [open close]
  #(str open % close))

(defn encloser [s]
  (embracer s s))

(defn applier [f]
  #(apply f %&))

(defn concatter [f]
  (comp f (applier concat)))

(def words (joiner " "))
(def lines (joiner "\n"))
(def stars (joiner "*"))

(def words* (variadic words))
(def lines* (variadic lines))
(def stars* (variadic stars))

(def braces (embracer "{" "}"))
(def enline (encloser "\n"))

(def block (comp braces enline))

(def line-cat (concatter lines))

(defn statement [x]
  (str x ";"))

(defn- identifier [prefix]
  (-> (name prefix) (gensym) (name)))

(defn- attribute-printer [key type name]
  (-> (vector key type name)
      (words)
      (statement)))

(defn func [name body]
  (lines*
    (words* "void" (str name "()"))
    (block
      body)))

(defn main [code]
  (func "main"
    (->> code
         (vector "gl_Position" "=")
         (words)
         (statement))))

(defn shader [declarations out]
  (lines*
    (lines declarations)
    (main out)))
