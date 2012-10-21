(ns webgl.presenters.help
  (:require [webgl.kit.d3       :as d3]
            [webgl.kit.rx       :as rx]
            [webgl.kit.workflow :as w])
  (:require-macros [webgl.kit.workflow.macros :as wm]))

(defrecord Presenter [view])

(defn show-help [view txt]
  (-> view (d3/html txt)))

(wm/defworkflow help-flow)

(wm/defstate help-flow :init
  [view]
  (show-help view
    "<p>Welcome to this web based content editor proto type.</p>
     <p>When starting this editor you are presented with three panels.
        Right now only the bottom panel shows anything interesting
        so let us focus on that for now, Each of the dots you
        can see represents an <b>operator</b></p>
     <p>The dot to the right for example is a <b>generator</b> It simply
        produces a triangle with a default size. The dot to the right
        is a <b>transformation</b>. It's is connected to the triangle operator
        and is therefore <b>applied</b> to it.</p>
     <p>Why don't you click on the transformation operator now ?</p>"))

(wm/defstate help-flow :operator-selected
  [view]
  (show-help view
    "<p>When selecting an operator you get to see a set of properties
        you can change to alter the operators behaviour. The properties
        are shown in the panel to the right of this one. Notice that
        the triangle operator has no properties.</p>
     <p>If you modify a property the changed value will be remembered
        if you switch to another operator.</p>
     <p>To see the effects of your change you can press <b>r</b> while
        an operator is selected to display it.</p>"))

(wm/defstate help-flow :operator-displayed
  [view]
  (show-help view
    "<p>When displaying an operator it is rendered in the panel
        on the right side of the screen.</p>
     <p>The displayed operator
        is <b>pinned</b> in the sense that selecting another operator
        won't change the currently displayed operator unless you
        press <b>r</b> again.</p>
     <p>Notice that the property editor for the selected operator
        is still active. When you change the properties of the
        displayed operator or any of its children the output view
        will be updated automatically, giving you instant feedback.</p>"))

(wm/deftrans help-flow :init :selected :operator-selected)
(wm/deftrans help-flow :operator-selected :display :operator-displayed)

(defn transition [presenter event]
  (w/trigger help-flow event (:view presenter)))

(defn present [view]
  (let [view (d3/select view)]
    (w/set help-flow :init view)
    (Presenter. view)))
