/*
 * functional curves in SVG
 * 
 * to do
 *   animate a parameter through a range and save each frame
 *   tidy code - remove globals,use objects etc
 *   compute cycles from fractional nodes to close path
 *   fixed problem with anonymous function in loop with new let statement- very nice
  */
var Path=[];
var BoundingBox=[];
var Crossings = [];
var Segments = [];
var midi_in;
var Cycles=1;

function get_params() {
    var params=[];
    for (var i=0;i<Sliders.length;i++) {
       params.push(parseFloat($('#sliderparam'+i).val())); 
    }
    return params;
}

function set_up() {
      def_sliders();
//      def_midi_listeners();    
}

function def_sliders() {
    for (let i=0;i<Sliders.length;i++) {
        var slider = Sliders[i];
        $('#slidername'+i).text(slider.id);
        $('#sliderparam'+i).val(slider.initial);
        $('#slider'+i ).slider({
           min:slider.min,
           max:slider.max,
           value:slider.initial,
           step:slider.step,
           slide: function(event, ui) {
                     $('#sliderparam'+i).val(ui.value);
                     refresh();  
                  }
           });
      }
}

function pot_luck() {
    for (let i=0;i<Sliders.length;i++) {
        var slider = Sliders[i];
        x = Math.round(slider.min + Math.random()* (slider.max - slider.min));
        $('#sliderparam'+i).val(x);
        $('#slider'+i ).slider("value", x);
 
      }
    refresh();
}

// basic function for use in function scripts
var RAD = Math.PI/180.0;

function sgn(t) {
   return (t>0) ? 1 : (t<0) ? -1 : 0;
}

function d2r(d){ return d*RAD }
function r2d(r){ return r/RAD}

function sin(t) {
   return Math.sin(t*RAD);   
}

function cos(t) {
   return Math.cos(t*RAD);   
}

function positive(x) {
   return x > 0;
}

function between(x,a,b) {
   return x>=a && x <=b;
}

function triangle(a,b,c) {
   return (a >=0 && b>=0  && c >= 0 && b+c >= a &&  a+c >= b && a+b >= c );
}

function parsefloat(s) {
    var n = parseFloat(s);
    if (isNaN(n))
      return 0;
    else return x;
}

function round(number,precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

function fn_points(stepsize,params,scale,maxcycles) {
    var eps=0.0001;
    var points = [];
    var start =fn(0,params,scale)
    var cycle=0; 
    while(true) {
       for (var t=360*cycle;t<=(cycle+1)*360+stepsize;t+=stepsize) 
           points.push(fn(t,params,scale));
       end = fn((cycle+1)*360,params,scale);
       d= Math.sqrt(Math.pow(end[0]-start[0],2) + Math.pow(end[1]-start[1],2));
       cycle+=1;
       if (d < eps || cycle >= maxcycles ) break;
    }
//    console.log(points);
    return points;    
}

function make_path() {   
    params = get_params();
    var stepsize = parseFloat($('#stepsize').val());
    var scale = parseFloat($('#scale').val());
    var maxcycles = parseFloat($('#maxcycles').val());
//    alert(stepsize);
//    alert(JSON.stringify(params));
    var pts = fn_points(stepsize,params,scale,maxcycles);
    BoundingBox = bounding_box(pts);

//    alert(JSON.stringify(pts));
    Path =  svg_points(pts) ;
//    Crossings = [];
    Segments = [];
 }

function svg_points(points) {
    var p = points[0];
    var s= " M " + p[0]+ " " + p[1];
    for (var i=1; i <points.length ; i++) {
         p = points[i];
         s+= " L " + p[0]+ "," + p[1];
    }
    return s;
}

function bounding_box(points) {
   xs = points.map(function(v,i) {return v[0];});
   ys = points.map(function(v,i) {return v[1];});
   minx = Math.min.apply(Math,xs);
   maxx = Math.max.apply(Math,xs);
   miny = Math.min.apply(Math,ys);
   maxy = Math.max.apply(Math,ys);
   return [minx,maxx,miny,maxy];
}

function svg_path(path,style) {
    var svg = "<path d='"+path+"' ";
    svg += " style='"+style;
    svg +="'/>";
    return svg;
}

function make_svg() {
   make_path();
   line_width=$('#line_width').val();
   line_colour=$('#line_colour').val(); 
   padding=parseInt($('#padding').val());
   canvas=$('#canvas');
   width = Math.round(2*padding - BoundingBox[0] + BoundingBox[1]);
   height= Math.round(2*padding - BoundingBox[2] + BoundingBox[3]);
   $('#svgimage').attr("width",width);
   $('#svgimage').attr("height",height);
   
   canvas.empty();
   transform = "translate(" + (padding -  BoundingBox[0]) +","+ (padding - BoundingBox[2]) +") ";
//  alert(transform);
   canvas.attr("transform", transform);
   canvas.append("<title>Three Links</title>");

   var line_style=null;
   if(line_width != 0) line_style="fill: none; stroke:"+line_colour+"; stroke-width:"+line_width+"; ";
   canvas.append(svg_path(Path,line_style));
        
    $("#svgframe").html($('#svgframe').html());  
}


function page_svg(){
    var svg = document.getElementById("svgimage");
    var serializer = new XMLSerializer();
    var svg_blob = new Blob([serializer.serializeToString(svg)],
                            {'type': "image/svg+xml"});
    var url = URL.createObjectURL(svg_blob);
    window.open(url, "svg_win");
} 

function refresh() {   
    make_path();
    make_svg();   
}

function mv(min,max,val) {
    return Math.round(min + (max-min) * val / 100) ;
};

WebMidi.enable(function(err) { 
   if (err) console.log("WebMidi could not be enabled"); 
   else  console.log("WebMidi enabled!");
   console.log(WebMidi.inputs);
   midi_in= WebMidi.inputs[0];
});

function configure_midi() {
  for (var i=0;i<Sliders.length;i++) {  
     let slider = Sliders[i];
//     console.log(slider);
     midi_in.addListener("controlchange",i+1,
          function (e) {$('#'+slider.id).val(mv(slider.min,slider.max,e.data[2]));refresh(); console.log(e.data[2]);}
     );
    }    
};

// crossings

function refresh_crossings() {
    make_svg2();
    Crossings = [];
    Segments = [];
    $('#crossings').text('');

}

// terible copy of makesvg with different element ids  
function make_svg2() {
  //  make_path();  already done 
   line_width=$('#line_width').val();
   line_colour=$('#line_colour').val(); 
   padding=parseInt($('#padding').val());
   canvas=$('#canvas2');
   width = Math.round(2*padding - BoundingBox[0] + BoundingBox[1]);
   height= Math.round(2*padding - BoundingBox[2] + BoundingBox[3]);
   $('#svgimage2').attr("width",width);
   $('#svgimage2').attr("height",height);
   
   canvas.empty();
   transform = "translate(" + (padding -  BoundingBox[0]) +","+ (padding - BoundingBox[2]) +") ";
//  alert(transform);
   canvas.attr("transform", transform);
   canvas.append("<title>Three Links</title>");

   var line_style=null;
   if(line_width !== 0) line_style="fill: none; stroke:"+line_colour+"; stroke-width:"+line_width+"; ";
   canvas.append(svg_path(Path,line_style));
        
    $("#svgframe2").html($('#svgframe2').html());  
}
function distance2(p1,p2) {
    return (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]);
}

function get_crossings() {
    $('#crossings').text('');
    var scale = parseFloat($('#scale').val());
    var inc = parseFloat($('#inc').val());
    var dz = parseFloat($('#dz').val());  
    var eps = parseFloat($('#eps').val());  
    var dwell = parseFloat($('#dwell').val());  
//    console.log([scale,inc,dz,eps]);
    Crossings = compute_crossings(inc,eps,dz,dwell,params,scale);  
//    console.log(Crossings);
    $('#crossings').text(Crossings.length / 2 );
    var cross_points = crossings_to_points(Crossings,params,scale);  
//    console.log(cross_points);
    make_svg2();
    canvas = $('#canvas2');
    canvas.append(svg_crossings(cross_points));
    $("#svgframe2").html($('#svgframe2').html());  
}

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function compute_crossings(stepsize,eps,dz,dwell,params,scale){
    var pts = [];
    var eps_2 = eps*eps;
    var dz_2 = dz*dz;
    var dwell_2 = dwell*dwell;
    for (var i=0;i<=360 ;i+=stepsize) {
        var f1 = fn(i,params,scale);
         for (var j=dz;j<=360;j+=stepsize){
            if ((i - j) * (i -j) < dz_2) continue;
            if ((i +360  - j) * (i +360 -j) < dz_2) continue;
            if ((i -360  - j) * (i -360  -j) < dz_2) continue;
            
            var f2 = fn(j,params,scale);
            var d = distance2(f1,f2);
             if (d < eps_2) {
                 if(pts.length > 0) {
                   var lastp = pts.last();
                   var nextp = [i,j,d];
                   var near = (lastp[0] - nextp[0]) * (lastp[0] - nextp[0])
                   if (near > dwell_2) 
                       pts.push(nextp);
                   else if (lastp[2] > nextp[2])
                       pts[pts.length -1] = nextp;
                    
                 }
                 else  {
                    var nextp = [i,j,d]; 
                    pts.push(nextp);
                 }
             }
        }
     }
     return pts;
}

function crossings_to_points(crossings,params,scale) {
   var pts = [];
   for (var i =0;i < crossings.length ;i++) {
      var cross = crossings[i];
      var pt= fn(cross[0],params,scale);
      pts.push(pt);
   }
   return pts; 
}

function svg_crossings (points) {
    var s= "";
    for (var i=0; i <points.length ; i++) {
         p = points[i];
         s+= "<circle cx='" + p[0]+ "' cy='" + p[1] +"' r='2' fill='black' />" 
    }
    return s;
}

function segment_length(t1,t2,stepsize,params,scale) {
   var s = 0;
   for (var t = t1;t<t2;t+=stepsize) {
       var a = fn(t,params,scale);
       var b = fn(t+stepsize,params,scale);
       var d= Math.sqrt(distance2(a, b));
       s += d;      
   }
   return [s,t1,t2,t2-t1]; 
}

function segment_lengths(crossings,stepsize,params,scale) {
   var delta = 0.2;
   var segments = [];
   for (var i = 0;i < crossings.length;i++) {
        var a=crossings[i][0];
        var b= ( (i + 1)== crossings.length ? crossings[0][0] +360 : crossings[i+1][0]);
        var sl = segment_length(a,b,stepsize,params,scale);
        if (sl[3] > delta)
          segments.push(sl);
   }
   return segments; 
}

function get_segment_lengths() {
    var inc = parseFloat($('#inc').val());
    params = get_params();
    var scale = parseFloat($('#scale').val());
//    console.log(Crossings.length);
    if (Crossings.length != 0) Segments = segment_lengths(Crossings,inc,params,scale); else Segments= [];
    $('#segments').text(Segments.length);
 //   console.log(Segments);
}

function points_3d(segments,stepsize) {
    params = get_params();
    var points = [];
    var cseg = 0;
    var current = segments[cseg];
    start = current[1];
    for (var i=0;i<360 ;i+=stepsize) {
       t= i + start;
       if (t > current[2]) {
             cseg++;
             current=segments[cseg];
       }
       parity= cseg % 2;
       xy = fn(t,params,1);
       h = cos((t - current[1]) * 180/ current[3]) ;
       if (parity == 1) h=-h;
       points.push([xy[0],xy[1],h]);
    }
 //   console.log(points);
    return points;    
}   

// Functions to generate openscad

function make_scad() {
    var stepsize = parseFloat($('#stepsize').val());
    var params = get_params();
    var cons =$('#construction').val();
    var open_ended = $('#open-ended').is("checked") ? "on" : "off" ;
    var scale = parseFloat($('#scale').val());
    var maxcycles = parseFloat($('#maxcycles').val());
    text = $('#scad');
    text.empty();
    text.append("&#10;&#10;");
    text.append("// function "+ $('#fname').text() +"&#10;");
    for (var i =0;i<params.length;i++) {
        text.append("//  "+Sliders[i].id+"="+params[i]+"&#10;");
    }
    text.append("Depth = "+$('#depth').val()+";&#10;");
    text.append("Sides = "+$('#sides').val()+";&#10;");
    text.append("R = "+$('#line_width').val()/2/scale+";&#10;");
    text.append("Scale = "+$('#scale').val()+";&#10;");
    if (cons != "2D") {
          text.append("Kscale = [1,1,"+$('#vscale').val()+"];&#10;");
          text.append("Base = "+$('#zbase').val()+";&#10;");
          text.append("Phase =45;&#10;");
    }
    text.append('Construction="'+cons+'";&#10;');
    text.append('Open_ended="'+open_ended+'";&#10;');
    text.append("Path  = [  &#10;");
    if (Segments.length > 0)
         var points = points_3d(Segments,stepsize);
    else var points = fn_points(stepsize,params,1,maxcycles); 
    for (var i=0;i <points.length;i++) {    
          s=points[i];
          text.append ("["+s[0]+","+s[1] + "," + (s[2]===undefined ? 0 : s[2]) +"],&#10;");
       }
     text.append("]; &#10;"); 
     $('#info').append ("OpenSCAD generated &#10;");
 };  
 

function download_scad() {
    var text = $('#scad').text() + $('#base').text();
    var file = new Blob([text], {type: text/text});
    var filename='FO.scad';
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

function save_design() {
    var design ="<preset>"
    design +="<title>"+ $('#fname').text() +"</title>";
    design+="<scale>" +$('#scale').val() +"</scale>";
    design+="<stepsize>" +$('#stepsize').val() +"</stepsize>";
    design+="<maxcycles>" +$('#maxcycles').val() +"</maxcycles>";
    for (var i =0;i<params.length;i++) {
        design+="<param><name>"+Sliders[i].id+"</name><val>"+params[i]+"</val></param>";
    }
    design+="</preset>";
    var d = encodeURIComponent(design);
    var designer =encodeURIComponent($('#designer').val());
    var title =encodeURIComponent($('#title').val());
    var comment = encodeURIComponent($('#comment').val());
    var url = "save-design.xq?designer="+designer+"&title="+title+"&design="+d+"&comment="+comment;
//     alert(url);
     $('#sr').load(url);
}

$(document).ready(function(){
     set_up();
     refresh();
})
