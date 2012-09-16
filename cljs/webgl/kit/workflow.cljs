(ns webgl.kit.workflow
  (:refer-clojure :exclude (set))
  (:require [clojure.set :as s]))

(defn make []
  (atom {:current     []
         :states      {}
         :transitions {}}))

(defn current [flow]
  (:current @flow))

(defn set [flow state & args]
  (let [cur-states (current flow)
        new-states (if (sequential? state)
                     state
                     [state])
        states     (:states @flow)]
    (swap! flow assoc :current (vec new-states))
    (doseq [out-fn (map (comp :out states) cur-states)]
      (when out-fn
        (out-fn)))
    (doseq [state (map states new-states)]
      (let [out (apply (:in state) args)]
        (when (fn? out)
          (swap! flow assoc-in [:states (:id state) :out] out))))))

(defn states [flow]
  (keys (get-in @flow [:states])))

(defn events
  ([flow]
     (keys (get-in @flow [:transitions])))
  ([flow from to]
     (let [trans (get-in @flow [:transitions])]
       (filter #(some #{to} (keys (get-in trans [% from])))
               (keys trans)))))

(defn trigger [flow event & args]
  (when-let [event (get-in @flow [:transitions event])]
    (let [trans (->> (:current @flow)
                     (map event)
                     (remove nil?))]
      (when (seq trans)
        (doseq [action (mapcat vals trans)]
          (apply action args))
        (apply set flow (mapcat keys trans) args)))))
