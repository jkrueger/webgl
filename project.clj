(defproject webgl "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1450" :scope "test"]
                 [crate "0.2.0-alpha4"]
                 [fetch "0.1.0-alpha2"]
                 [jayq  "0.1.0-alpha2"]
                 [waltz "0.1.0-alpha1"]
                 [noir  "1.2.2" :exclusions [org.clojure/clojure]]]
  :cljsbuild
  {:crossovers     [fetch.macros]
   :crossover-path "crossover"
   :repl-launch-commands
   {"chrome" ["chromium-browser" "http://localhost:8080/webgl"]}
   :builds
   [{:source-path "cljs"
     :compiler    {:output-to "resources/public/js/webgl.js"
                   ;; :optimizations :advanced
                   :optimizations :whitespace
                   :pretty-print true
                   :externs ["externs/jquery.js"]}}]})
