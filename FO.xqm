xquery version "3.0";

module namespace FO = "http://kitwallace.co.uk/lib/FO";
declare variable $FO:functions := doc("data/object-functions.xml")//preset;
declare variable $FO:saved-designs := doc("data/saved-functional-designs.xml")/saved;
declare variable $FO:dir := "/db/apps/FO/";

declare function FO:substitute($text,$params, $n) {
       let $p := $params[$n]
       let $target := concat("p\[",$n - 1,"\]")
       let $replacement := $p/name
       let $new-text := replace($text,$target,$replacement)
       
       return 
          if ($n = count($params))
          then $new-text
          else FO:substitute($new-text,$params,$n+1)       
};

declare function FO:reformat-function($preset) {
   FO:substitute($preset/function, $preset/param, 1)
};

declare function FO:send-parameters()  {
         let $email := request:get-parameter("email",())
         return
         let $emailmessage := 
  <mail>
   <from>kit@kitwallace.co.uk</from>
   <to>{$email}</to>
   <subject>Your design</subject>
   <message>
     <xhtml><div>
            <h2>Your design</h2>

          
            </div>
     </xhtml>
   </message>
  </mail>
 
  let $mail := mail:send-email($emailmessage,(),())
  return
      if ($mail)
      then <div>
             An email has been sent to {$email} with your design parameters.  Should you wish to have this design made, please reply giving your postal address and choic of material.
          </div>
      else 
          <div>Whoops - something went wrong with the email address {$email}. Please try again. </div>
};

declare function FO:design-to-preset($design) {
    let $function := $FO:functions[title=$design/design/preset/title]
    return 
       element preset {
          $function/title,
          $function/description,
          $design/design/preset/(scale,maxcycles,stepsize),
          element comment {concat($design/title," by ", $design/designer," : ",$design/comment)},
          for $param in $function/param
          return element param {
                 $param/(* except default),
                 element default {
                     let $d := $design/design/preset/param[name=$param/name]/val
                     return if ($d) then string($d) else $param/default/string()
                 }
          },
          $function/function
       }
};