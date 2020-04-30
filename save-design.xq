xquery version "3.0";
import module namespace fourier = "http://kitwallace.co.uk/lib/fourier" at "fourier.xqm";

let $designer := request:get-parameter("designer",())
let $title := request:get-parameter("title",())
let $comment := request:get-parameter("comment",())
let $design := util:parse(request:get-parameter("design",()))
return
     if ($designer!="" and $title!="")
     then
let $id := util:uuid()
let $save :=
 element saved-design {
      element id {$id},
      element ts {current-dateTime()},
      element title {$title},
      element designer {$designer},
      element comment {$comment},
      element design {$design}
      
 }
let $login := xmldb:login("/db/apps/3d","treeman","fagus")
(:   :let $serialize := util:declare-option("exist:serialize","method=text media-type=text/text")  :)
let $add := update insert $save into $fourier:saved-designs
return
   <span>Your design has been saved with reference no <a href="?design-id={$id}">{$id}</a></span>
   else 
     <span>Designer and/or Title missing</span>