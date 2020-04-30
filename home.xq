declare option exist:serialize "method=xhtml media-type=text/html";
import module namespace FO = "http://kitwallace.co.uk/lib/FO" at "FO.xqm";

let $preset :=request:get-parameter("preset","Lissajous Figures")
let $design-id := request:get-parameter("design-id",())
let $midi := request:get-parameter("midi",())
let $design := $FO:saved-designs/saved-design[id=$design-id]
let $preset := 
                   if ($design)
                   then FO:design-to-preset($design)
                   else $FO:functions[title=$preset]
let $preset-title := ($preset/title)

return 
  
<html >
    <head>
        <title>Functional Objects</title>
        <script src="https://code.jquery.com/jquery-1.12.4.js"/>
        <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"/>
        <script type="text/javascript" src="assets/webmidi.min.js"/>
        <link rel="stylesheet" type="text/css" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"/>
        <link rel="stylesheet" type="text/css" href="assets/screen.css" media="screen"/>
        <script type="text/javascript" src="assets/functional-objects.js"/>
        <script type="text/javascript" src="assets/controls.js"/>
        <script type="text/javascript" >
            {$preset/function/text()}&#10;
            Sliders = [];
            {for $param at $i in $preset/param
             return concat("Sliders[",$i - 1,"] = {id:'",$param/name,"',min:",$param/min,",max:",$param/max,",step:",if ($param/step) then $param/step else 1,",initial:",$param/default,"};&#10;") 
            }
        </script>
         <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="shortcut icon" type="image/png" href=""/>
        <link rel="icon" type="image/png" sizes="32x32" href=""/>
        <link rel="icon" type="image/png" sizes="16x16" href=""/>
    </head>
    <body>
        <h1><a href="?">Functional Objects</a>&#160; 
            <span>
                <button style="background-color: lightgreen" id="but0" onClick="tab(0)">Construct</button>
            </span>&#160; 
            <span>
                <button id="but4" onClick="tab(4)">Save/Restore Designs</button>
            </span>&#160;
            <span>
                <button id="but1" onClick="tab(1)">Braiding</button>
            </span>&#160; 
            <span>
                <button id="but2" onClick="tab(2)">Generate OpenSCAD</button>
            </span>&#160;
            <span>
                <button id="but3" onClick="tab(3)">Help</button>
            </span>&#160;
            <span>
                <button onClick="page_svg()">Image Page</button>
            </span> 

        </h1>
        <div id="tab0">
            <div id="left">
                <form action="?">
                <b>Function </b> 
                <select name="preset" id="preset">
                   {for $pre in $FO:functions 
                    return <option>
                          {if  ($pre/title=$preset-title) then attribute selected {"selected"} else () }
                          {$pre/title/string()}
                          </option>
                   }
                </select>
                    <input type="submit" value="Select"/>
                </form>
               <span style="display:none" id="fname">{$preset/title/string()}</span>
               <div>{$preset/description/node()}</div>
               {if ($preset/comment)
                then <div><b>{$preset/comment/node()}</b></div>
                else ()
               }
               

               {if ($midi) then  <button onclick="configure_midi()">Connect Midi</button> else() }
               
            <table id="sliders">
                {for $param at $j in $preset/param
                 let $i := $j - 1
                 return
                 <tr>
                    <th>
                         <span id="slidername{$i}">{$param/name/string()}</span> 
                         {if ($param/title)
                          then <span title="{$param/title}" style="color:blue" >?</span>
                          else "&#160;"
                         }&#160;
                    </th>
                    <td width="75%">
                       <div class="slider" id="slider{$i}"/> 
                    </td>
                    <td>&#160;&#160;
                        <input type="text" size="3" id="sliderparam{$i}" onchange="refresh()"/>
                    </td>
                </tr>
                }
            </table>
            <div>Randomly set the parameter values <button onclick="pot_luck()">Potluck</button></div>

            <br/>
            <table>
                
                  <tr >
                    <th>Path </th>
                    <td>Step size <input type="text" size="3" id="stepsize" value="{($preset/stepsize,0.1)[1]}"  title="set the step size in degrees"
                       onchange="make_svg()"/>
                        Scale <input type="text" size="3" id="scale" value="{($preset/scale,1)[1]}"  onchange="make_svg()"/>
                        Max Cycles <input type="text" id="maxcycles" size="3" value="{($preset/maxcycles,100)[1]}" onchange="make_svg()"/>
                    </td>
                </tr>
                  <tr>
                    <th>Line</th>
                    <td>Line Width <input type="text" size="6" id="line_width" value="1"  onchange="make_svg()"/> Line Color
                        <input type="text" size="15" id="line_colour" value="red"  onchange="make_svg()"/>
                        Padding <input type="text" id="padding" value="20" size="3"  onchange="make_svg()"/>
                    </td>
                </tr>
               
             </table>
             <div><h2>Function code</h2>
                 <pre>{FO:reformat-function($preset)}</pre>
            </div>
            </div>
            <div id="svgframe" >
                <svg xmlns="http://www.w3.org/2000/svg" id="svgimage" width="800" height="800">
                    <g id="canvas" transform="translate(50,20)"/>
                </svg>
            </div>
        </div>
        <div id="tab4" style="display:none">
         <h3>Save design</h3>
             <table>
               <tr><th>Designer</th><td><input type="text" id="designer" size="20" /></td></tr>
               <tr><th>Title</th><td><input type="text" id="title" size="20" /></td></tr>
               <tr><th>Comment</th><td><input type="text" id="comment" size="50" /></td></tr>
               <tr><th>Save</th><td><button onclick="save_design()">Save It</button>
                 &#160; <span id="sr">Not saved</span>   
               </td></tr>
             </table>
             
          <h3>Saved Designs</h3>
          {for $design in $FO:saved-designs/saved-design
           return 
               <div>
                    <a href="?design-id={$design/id}">{$design/title/string()}</a> 
                    by {$design/designer/string()} using {$design/design/preset/title/string()}
               </div>
          }
        </div>
        <div id="tab1" style="display:none">
        <h1>Create braiding</h1>
               Click Refresh to start <button onClick="refresh_crossings()">Refresh</button>
               <table>     
                   <tr> <th>Step</th><td><input type="text" size="3" id="inc" value="0.1"/> </td></tr>
                   <tr> <th>Dead Zone</th><td><input type="text" size="3" id="dz" value="1"  title="increase if crossings on sharp corners"/></td></tr>
                <tr> <th> Eps </th><td><input type="text" size="3" id="eps" value="0.5" title="increase if crossings missed"/></td></tr>
                 <tr> <th>Dwell</th><td> <input type="text" size="3" id="dwell" value="0.5" title="??"/></td></tr>
                 <tr><th>Crossings</th><td>
                        <button onClick="get_crossings()">Compute Crossings</button>  # crossings: <span id="crossings"/>
                     </td></tr>
                 <tr><th>Segments</th><td> 
                         <button onClick="get_segment_lengths()">Compute Segment lengths</button> # segments: <span id="segments"/>
                    </td>
                </tr>
            </table>
             <div id="svgframe2" style="page-break-before: always; position:absolute; left:55%; top:50px;">
                <svg xmlns="http://www.w3.org/2000/svg" id="svgimage2" width="800" height="800">
                    <g id="canvas2" transform="translate(50,20)"/>
                </svg>
            </div>
        </div>
        <div id="tab2" style="display:none">
                <table>
                   
                    <tr>
                        <th>Depth of smoothing </th>
                        <td>
                            <input type="text" size="3" id="depth" value="0"/>
                        </td>
                    </tr>
                    <tr>
                        <th># sides of rope  (resolution if hulling )</th>
                        <td>
                            <input type="text" size="6" id="sides" value="10"/>
                        </td>
                    </tr>
                    
                    <tr>
                        <th>Vertical scale </th>
                        <td>
                            <input type="text" size="6" id="vscale" value="2"/>
                        </td>
                    </tr><tr>
                        <th>Base </th>
                        <td>
                            <input type="text" size="6" id="zbase" value="-1000"/>
                        </td>
                    </tr>
                    <tr><th>Open-ended?</th><td><input type="checkbox" id="open-ended" /></td></tr>
                    <tr>
                        <th>
                            Construction
                           
                        </th>
                        <td><select id="construction">
                            <option value="2D">2D</option>
                            <option value="poly">Polyhedron</option>
                            <option value="hull">Hulled Spheres</option> 
                            <option value="tile">polygon - requires closed path</option>
                        </select></td>
                    </tr>
                    <tr>
                        <th>
                            <button onClick="make_scad()">Generate OpenSCAD</button>
                            <button onClick="download_scad()">Download OpenSCAD</button>
                        </th>
                    </tr>
                </table>
                <div>
                    <pre id="scad" style="page-break-after: always;"/>
                    <hr/>
                    <pre id="base" style="display:none;">
                    {util:binary-to-string(util:binary-doc(concat($FO:dir,"fo.scad")))}
                    </pre>
                </div>
            </div> 
        <div id="tab3" style="display:none">
            <h3>Purpose</h3>
            <div>This interactive script supports the design of 2D and 3D objects based on mathematical functions.  The application is generic so that other functions can be described and added to the configuration.</div>
            <div>
                <h3>Development</h3>
                This script was developed by <a href="http://kitwallace.co.uk">Kit Wallace</a> using XQuery, Javascript, JQuery and SVG (and StackOverFlow !).  Output to STL or DXF is via generated OpenSCAD scripts.
               See <a href="https://github.com/KitWallace/FunctionalObjects">GitHub</a>
                
                <h3>Usage</h3>
                <ul>
                  <li>Select the required function in the dropdown.  More can be added on request.</li>
                  <li>Using the sliders, adjust the curve to create your chosen pattern. You can also enter valus in the value fields directly to override the sliders which increment in whole numbers only. </li>
                  <li>The resolution of the computed path can be adjusted with the Step size parameter. Scale changes the overall scale.</li>
                  <li>The appearance of the image can be changed with the line width and Line colour parameters. </li>
                  <li>If you want to save the pattern as an SVG file, a downloadable version created by clicking the <b>Image Page</b> tab. (but only in Firefox :( )</li>
                  <li>You can save your design and load previously saved designs in the <b>Save/Restore Designs</b> tab. Currently no login is needed but this may have to change.</li>
                  <li>
                     The <b>Braiding</b> tab allows you to compute the crossing points which are used to interweave the path when making a braided 3D object.
                      <ul>
                          <li>Ensure that none of the lengths of segments between crossings is small because this will create very sharp bends in the 3D curve.</li>
                         <li>Click <b>Compute Crossings</b> to compute the positions of crossings.  These will be marked on the pattern.  The algorithm used to find crossings is not yet perfect and some patterns will not work.  If there are too few, try increasing Eps.  If there are too many, try increasing the Dead Zone. </li> 
                         <li>If the crossings look right, check that the number is correct. </li>
                         <li>To generate the segments, click <b>Compute Segments</b> which will create the segmented curve and output the number of segments, which should be double the number of crossings.</li>
                      </ul>
                      </li>
                  <li>To generate OpenSCAD code, click the <b>Generate OpenSCAD</b> tab. If Crossings have been created, the output will be have an oscillating Z value to achieve the braiding. If there are no crossings, z will be 0</li>
                  <li>The parameters which affect the solid appearance, such as the number of sides can be set in the form (or altered later in the OpenSCAD code)</li>
                  <li>To generate the code, first click <b>Generate OpenSCAD</b> which shows the text (minus the base code) on the screen.  If it looks ok, click <b>Download OpenSCAD</b> to save the complete script which can then be executed (provided <a href="http://openscad.org">OpenSCAD</a> is installed!)</li> 
                  <li>For laser cutting, export the DXF. The version output is acceptable to LaserCut5.3. Scale can be changed in either OpenSCAD or LasserCut5.3</li>
                  <li>For laser engraving, where you want the lines to be continous lines following the path, not outlines of spaces,  save the SVG inage (using Firefox), import into Inkscape and save as DXF.  The version exported R14 is accepatble to Lasercut5.3</li>
                </ul>
                
            </div>
        </div>
    </body>
</html>