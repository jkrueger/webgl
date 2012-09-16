(ns webgl.test.workflow
  (:require [webgl.kit.workflow :as w]
            [goog.string        :as gstr])
  (:require-macros [webgl.jasmine             :as j]
                   [webgl.kit.workflow.macros :as wm]))

(j/describe "A work flow"
            
  (j/it "can be empty"
    (j/expect (w/make) => toBeTruthy))
  
  (j/it "can contain a state"
    (let [flow (w/make)]
      (wm/defstate flow :foo)
      (j/expect
       (-> (w/states flow)
           (into-array))
       => (toContain :foo))))
  
  (j/it "can contain multiple states"
    (let [flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/defstate flow :baz)
      (j/expect (-> (w/states flow) (into-array)) => (toContain :foo))
      (j/expect (-> (w/states flow) (into-array)) => (toContain :bar))
      (j/expect (-> (w/states flow) (into-array)) => (toContain :baz))))

  (j/it "can contain a transition"
    (let [flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/deftrans flow :foo :event :bar)
      (j/expect
        (-> (w/events flow :foo :bar)
            (into-array))
        => (toContain :event))))

  (j/it "can contain multiple transitions"
    (let [flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/deftrans flow :foo :event :bar)
      (wm/deftrans flow :foo :event2 :baz)
      (j/expect
        (-> (w/events flow)
            (into-array))
        => (toContain :event))
      (j/expect
        (-> (w/events flow)
            (into-array))
        => (toContain :event2)))))

(j/describe "Transitions"
            
  (j/it "can be triggered"
    (let [spy  (js/jasmine.createSpy "event-spy")
          flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/deftrans flow :foo :event :bar
        []
        (spy))
      (w/set flow :foo)
      (w/trigger flow :event)
      (j/expect spy => (toHaveBeenCalled))))
  
  (j/it "can be parameterized"
    (let [spy  (js/jasmine.createSpy "event-spy")
          flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/deftrans flow :foo :event :bar
        [x]
        (spy x))
      (w/set flow :foo)
      (w/trigger flow :event 5)
      (j/expect spy => (toHaveBeenCalledWith 5))))

  (j/it "can not be triggered when the event is unknown"
    (let [flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/deftrans flow :foo :event :bar)
      (w/set flow :foo)
      (w/trigger flow :event-that-does-not-exist)
      (j/expect
        (-> (w/current flow)
            (into-array))
        => (toEqual (array :foo)))))

  (j/it "can not be triggered when the current state has no transition for an event"
    (let [flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar)
      (wm/defstate flow :baz)
      (wm/deftrans flow :foo :event :bar)
      (w/set flow :baz)
      (w/trigger flow :event)
      (j/expect
        (-> (w/current flow)
            (into-array))
        => (toEqual (array :baz))))))

(j/describe "States"
            
  (j/it "can have input actions"
    (let [spy  (js/jasmine.createSpy "state-spy")
          flow (w/make)]
      (wm/defstate flow :foo
        []
        (spy))
      (w/set flow :foo)
      (j/expect spy => toHaveBeenCalled)))

  (j/it "can get their input parameter through explicitly setting a state"
    (let [spy  (js/jasmine.createSpy "state-spy")
          flow (w/make)]
      (wm/defstate flow :foo
        [x]
        (spy x))
      (w/set flow :foo 5)
      (j/expect spy => (toHaveBeenCalledWith 5))))

  (j/it "get the same parameter as the transition that enters the state"
    (let [state-spy (js/jasmine.createSpy "state-spy")
          trans-spy (js/jasmine.createSpy "trans-spy")
          flow (w/make)]
      (wm/defstate flow :foo)
      (wm/defstate flow :bar
        [x]
        (state-spy x))
      (wm/deftrans flow :foo :event :bar
        [y]
        (trans-spy y))
      (w/set flow :foo)
      (w/trigger flow :event 5)
      (j/expect state-spy => (toHaveBeenCalledWith 5))
      (j/expect trans-spy => (toHaveBeenCalledWith 5))))

  (j/it "can have output actions"
    (let [i-spy (js/jasmine.createSpy "in-spy")
          o-spy (js/jasmine.createSpy "out-spy")
          flow (w/make)]
      (wm/defstate flow :foo
        []
        (fn []
          (o-spy)))
      (wm/defstate flow :bar
        []
        (i-spy))
      (w/set flow :foo)
      (wm/deftrans flow :foo :event :bar)
      (w/trigger flow :event)
      (j/expect i-spy => toHaveBeenCalled)
      (j/expect o-spy => toHaveBeenCalled))))
