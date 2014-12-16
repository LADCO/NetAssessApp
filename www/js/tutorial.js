netAssess.tutorial = {slides: [], slideCount: 0, width: 400, height: 300, active: true}

netAssess.tutorial.makeSlide = function(title, text, target, position, callback) {
  
  position = position || "below";
  callback = callback || function() {};  
  
  var slide = {title: title, text: text, target: target, position: position, callback: callback}
  netAssess.tutorial.slides.push(slide)
  
}

netAssess.tutorial.makeSlide("Welcome to NetAssess!",
                             "This tool is meant to assist with 5-year Network Assessments as required by <a href = 'http://www.ecfr.gov/cgi-bin/text-idx?SID=1c02841c6e1ad0e7e8ecaa87954ac180&node=se40.6.58_110&rgn=div8'>40 CFR &#0167;58.10(d)</a>.<p> You can start by running through this quick tour, or close this box with the 'x' in the top right corner and jump right in to the tool. Refer to the <a href = '#' target='_blank'>Guidance Document</a> for more detailed information about the App.</p>", "map", "center")
                             
netAssess.tutorial.makeSlide("Parameter of Interest",
                             "The first step in the assessment process should be selecting a parameter. You do that with the parameter selection dropdown to the right. You can scroll through the list to find your parameter or use the search box to search by name or AQS code. Once you select a parameter the map will update to show the locations of known sites monitoring for that parameter.", "s2id_expParam", "left")
                             
netAssess.tutorial.makeSlide("Area of Interest",
                             "Next you will need to select an Area of Interest. This allows you to focus your analysis on a specific area of the country. You can open the <b>Area of Interest Dialog</b> by clicking the <i class = 'fa fa-crosshairs'></i> button above.", "aoi_button", "below")

netAssess.tutorial.makeSlide("Area of Interest",
                             "From the Area of Interest dialog you can select an area of interest in several ways.",
                             "aoi", "right", netAssess.floaters.aoi.open)
netAssess.tutorial.makeSlide("Area of Interest",
                             "You can draw an area free-hand, from the 'Select a geography area'.<table style = 'padding-top: 5px'><tr><td style = 'vertical-align: top'><img src='images/glyphicons_096_vector_path_polygon.png'></td><td style = 'padding-left: 5px'>Allows you to draw a many sided polygon by clicking the map where vertices should be. Click the location of your first vertex to close the polygon and finalize the shape.</td></tr><tr><td style = 'vertical-align: top'><img src='images/glyphicons_094_vector_path_square.png'></td><td style = 'padding-left: 5px'>Allows you to define a rectangular area by clicking a dragging over the area you are interested in on the map.</td></tr><tr><td style = 'vertical-align: top'><img src='images/glyphicons_197_remove.png'></td><td style = 'padding-left: 5px'>If you start a drawing and change you mind, this allows you to cancel the drawing.</td></table>", "cancel_draw", "right")
netAssess.tutorial.makeSlide("Area of Interest",
                             "You can also select a predefined area such as a state, CBSA, or CSA. <ol><li>Click the cicle to the left of the Area Type you want.</li><li>The dropdown will update to reflect you choice.</li><li>Use the dropdown to select the specific area you are interested in.</li></ol> You can scroll through the list to locate your area, or use the text box to filter your choices.", "areaSelect", "right")

netAssess.tutorial.makeSlide("Correlation Matrix",
                             "The correlation matrix gives you information about how concentrations at monitors within your area of interest compare to one-another. This tool currently only works with <b>44201 - OZONE</b>, <b>88101 - PM2.5 - LOCAL CONDITIONS</b>, and <b>88502 - ACCEPTABLE PM2.5 AQI & SPECIATION MASS</b>", "cormatButton", "below")
                             
netAssess.tutorial.makeSlide("Area Served",
                             "Area Served provides information about the area surrounding monitors in you area of interest. Clicking the button will calculate the area served by each monitor and draw polygons on the map representing those areas. You can then click on a polygon to get more information about that area.", "areaServedCalcButton", "below")
                             
netAssess.tutorial.makeSlide("Conclusion",
                             "This is the end of the tour for now. More will be added in the near future.",
                             "map", "center")

$(document).ready(function() {
  
  var name = "showtour"
  var showTour = "true";
  var ca = document.cookie.split(';');
  for(var i=0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1);
    if (c.indexOf(name) != -1) showTour = c.substring(name.length+1,c.length);
  }
  
  if(showTour == "true") {
    netAssess.tutorial.active = true;
    document.getElementById("tutGone").checked = false;
  } else {
    netAssess.tutorial.active = false;
    document.getElementById("tutGone").checked = true;
  }
  
  if(netAssess.tutorial.active) {
    netAssess.tutorial.advance()
  }
   
})

netAssess.tutorial.setPosition = function(target, position) {
  
  var rect = document.getElementById(target).getBoundingClientRect();
  var rect_center = {x: (rect.width / 2) + rect.left,
                     y: (rect.height / 2) + rect.top
  }
  
  var arrowPos = {
    "left": "",
    "top": "",
    "display": "none",
    "border-left-color": "transparent",
    "border-top-color": "transparent",
    "border-right-color": "transparent",
    "border-bottom-color": "transparent"
  }

  switch(position) {
    case "center":
      var position = {
        top: rect_center.y - (netAssess.tutorial.height / 2),
        left: rect_center.x - (netAssess.tutorial.width / 2),
        display: "block"
      }
      arrowPos.top = "";
      arrowPos.left = "";
      arrowPos.display = "none";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      break;
      
    case "above":
      var position = {
        top: rect.top - (netAssess.tutorial.height + 15),
        left: rect_center.x - (netAssess.tutorial.width / 2),
        display: "block"
      };
      arrowPos.top = netAssess.tutorial.height - 5;
      arrowPos.left = netAssess.tutorial.width / 2;
      arrowPos.display = "block";
      arrowPos["border-top-color"] = "#EFEFEF";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      arrowBorderPos.top = arrowBorderPos.top + 2.5
      arrowBorderPos["border-top-color"] = "black";
      break;
      
    case "below":
      var position = {
        top: rect.bottom + 15,
        left: rect_center.x - (netAssess.tutorial.width / 2),
        display: "block"
      };
      arrowPos.top = -20;
      arrowPos.left = (netAssess.tutorial.width / 2) - 10;
      arrowPos.display = "block";
      arrowPos["border-bottom-color"] = "#EFEFEF";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      arrowBorderPos.top = arrowBorderPos.top - 2.5
      arrowBorderPos["border-bottom-color"] = "black";
      break;
      
    case "left":
      var position = {
        top: rect_center.y - (netAssess.tutorial.height / 2),
        left: rect.left - (netAssess.tutorial.width + 15),
        display: "block"
      }
      arrowPos.top = (netAssess.tutorial.height / 2) - 10;
      arrowPos.left = netAssess.tutorial.width - 5;
      arrowPos.display = "block";
      arrowPos["border-left-color"] = "#EFEFEF";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      arrowBorderPos.left = arrowBorderPos.left + 2.5;
      arrowBorderPos["border-left-color"] = "black";
      break;
      
    case "right":
      var position = {
        top: rect_center.y - (netAssess.tutorial.height / 2),
        left: rect.right + 15,
        display: "block"
      }
      arrowPos.top = (netAssess.tutorial.height / 2) - 10;
      arrowPos.left = -20;
      arrowPos.display = "block";
      arrowPos["border-right-color"] = "#EFEFEF";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      arrowBorderPos.left = arrowBorderPos.left - 2.5;
      arrowBorderPos["border-right-color"] = "black";
      break;
      
    default:
      console.log("Unrecognized 'position' to setPosition function.")
  }
  
  var w = $(window).width();
  var h = $(window).height();
  
  if(position.left < 0) {
    var offset_x = 5 + (position.left + netAssess.tutorial.width);
  } else if((position.left + netAssess.tutorial.width) > w) {
    var offset_x = 5 + ((position.left + netAssess.tutorial.width) - w);
  } else {
    var offset_x = 0;
  }
  
  position.left = parseInt(position.left - offset_x, 10) + "px";
  arrowPos.left = parseInt(arrowPos.left + offset_x, 10) + "px";
  arrowBorderPos.left = parseInt(arrowBorderPos.left + offset_x, 10) + "px";
  
  if(position.top < 0) {
    var offset_y = 5 - position.top; 
  } else if((position.top + netAssess.tutorial.height) > h) {
    var offset_y = (position.top + netAssess.tutorial.height) - h;
  } else {
    var offset_y = 0;
  }

  position.top = parseInt(position.top + offset_y, 10) + "px";
  arrowPos.top = parseInt(arrowPos.top - offset_y, 10) + "px";
  arrowBorderPos.top = parseInt(arrowBorderPos.top - offset_y, 10) + "px";

  var $tut = $("#tutorial");
  $tut.css(position);
  $tut.find(".tutorial-arrow").css(arrowPos);
  $tut.find(".tutorial-arrow-border").css(arrowBorderPos);
  
}

netAssess.tutorial.advance = function() {
  
  var tut = netAssess.tutorial;
  var $tut = $("#tutorial");
  
  var cnt = tut.slideCount;
  
  $tut.find(".header").html(tut.slides[cnt].title)
  $tut.find(".content").html(tut.slides[cnt].text)
  tut.setPosition(tut.slides[cnt].target, tut.slides[cnt].position)
  tut.slides[cnt].callback();

  tut.slideCount++
  
}

netAssess.tutorial.close = function() {
  netAssess.tutorial.active = false;
  $("#tutorial").css("display", "none")
  $("*").off(".tutorial");
}

$("#tutNext").on("click", function() {
  
  if(netAssess.tutorial.slideCount == netAssess.tutorial.slides.length - 1) {
    $("#tutNext").text("Close")
  } else {
    $("#tutNext").text("Next")
  }
  if(netAssess.tutorial.slideCount == netAssess.tutorial.slides.length) {
    netAssess.tutorial.close()
  } else {
    netAssess.tutorial.advance()
  }
  
})

$("#tutorial .close").on("click", netAssess.tutorial.close);

$("#tutorial #tutGone").on("click", function(e) {
  var d = new Date();
  d.setTime(d.getTime() + (60*24*60*60*1000));
  var expires = "expires="+d.toUTCString();
  
  if(this.checked) {
    document.cookie = "showtour=false; " + expires
  } else {
    document.cookie = "showtour=true; " + expires
  }
  
})

$("#openTour").on("click", function() {
  if(netAssess.tutorial.active == false) {
    netAssess.tutorial.slideCount = 0;
    netAssess.tutorial.active = true;
    netAssess.tutorial.advance();
  }
})