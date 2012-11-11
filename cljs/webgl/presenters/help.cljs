(ns webgl.presenters.help
  (:require [webgl.kit.workflow :as w]
            [webgl.views.help   :as h])
  (:require-macros [webgl.kit.workflow.macros :as wm]))

(defrecord Presenter [view])

(wm/defworkflow help-flow)

(wm/defstate help-flow :init
  [view]
  (h/show-help view
    "<p>Welcome to this web based content editor proto type.</p>
     <p>When starting this editor you are presented with three panels.
        Right now only the bottom panel shows anything interesting
        so let us focus on that for now. The dot you can see represents an
        <b>operator</b>.</p>
     <p>As you can see it is currently labeled as unassigned. This means it
        isn't doing anything right now.</p>
     <p>Why don't you click on the operator now so we can assign
        something to it?</p>"))

(wm/defstate help-flow :operator-first-selected
  [view]
  (h/show-help view
    "<p>When selecting an <b>unassigned</b> operator, you need to
        turn it into a real operator before you can work with it.
        To do that you first have to press <b>Alt</b>,
        which will display a help menu showing you the different kinds
        of operator types to pick from.</p>")
  (h/show-extended-button view)
  ;; (fn []
  ;;   (h/hide-extended-button view))
  )

(wm/defstate help-flow :operator-assigned
  [view]
  (h/show-help view
    "<p>Notice that the panel to the right has changed.
        It will either display the configurable properties
        or a message saying that there are none, based on
        your choice of operator</p>
     <p>After having assigned something to the operator
        you can display the result in the large area to the
        left. To do that press <b>Alt + r</b></p>"))

(wm/defstate help-flow :operator-displayed
  [view]
  (h/show-help view
    "<p>As you can see the shape you have picked is simply drawn
        in the output window and stull quite boring.</p>
     <p>As a next step let's transform the single operator we
        just created.</p>
     <p>...</p>"))

(wm/deftrans help-flow :init :selected :operator-first-selected)
(wm/deftrans help-flow :operator-first-selected :assigned :operator-assigned)
(wm/deftrans help-flow :operator-assigned :display :operator-displayed)

(defn transition [presenter event]
  (w/trigger help-flow event (:view presenter)))

(defn present [view]
  (w/set help-flow :init view)
  (Presenter. view))
