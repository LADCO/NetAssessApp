netAssess.tutorial = {text: [], title: [], target: [], position: [], trigger: [], slideCount: -1, left: 0, top: 0, width: 400, height: 300, active: true, offset_x: 0, offset_y: 0};

netAssess.tutorial.title[0] = "Parameter of Interest"
netAssess.tutorial.target[0] = "s2id_expParam"
netAssess.tutorial.position[0] = "left";
netAssess.tutorial.text[0] = "The first step in the assessment process should be selecting a parameter. You do that with the parameter selection dropdown above. You can scroll through the list to find your parameter or use the search box to search by name or AQS code. Once you select a parameter the map will update to show the locations of known sites monitoring for that parameter. Begin by selecting <b>44201 - Ozone</b>."
netAssess.tutorial.trigger[0] = function() {
  $("#tutorial").css("z-index", 6);
  $("#expParam").on("change.tutorial", function() {
    if(netAssess.tutorial.active) {
      if($("#expParam").val() == "44201") {
        netAssess.tutorial.advance();
        $("#expParam").off("change.tutorial");
        $("#tutorial").css("z-index", "");
      }
    }
  })
}

netAssess.tutorial.title[1] = "Area of Interest"
netAssess.tutorial.target[1] = "aoi_button";
netAssess.tutorial.position[1] = "below";
netAssess.tutorial.text[1] = "Next you will need to select an Area of Interest. This allows you to focus your analysis on a specific area of the country. Open the <b>Area of Interest Dialog</b> by clicking the <i class = 'fa fa-crosshairs'></i> button above."
netAssess.tutorial.trigger[1] = function() {
  $("#aoi_button").on("click.tutorial", function() {
    if(netAssess.tutorial.active) {
      netAssess.tutorial.advance();
      $("#aoi_button").off("click.tutorial");
    }
  })
}

netAssess.tutorial.title[2] = "Area of Interest";
netAssess.tutorial.target[2] = "aoi";
netAssess.tutorial.position[2] = "right";
netAssess.tutorial.text[2] = "From the area of interest dialog you can define an area of interest in several ways. You can draw a many-sided polygon with the draw polygon button, or define a rectangle with the draw rectangle button. Alternately, you can select a state, csa, or cbsa as an area of interest with the radio buttons and drop down at the bottom of the dialog. Like the Parameter of Interest dialog, you can scroll through the list or use the provided search box. <b>Create an area of interest in any way you choose.</b> <p> This is the end of the tutorial for now."
netAssess.tutorial.trigger[2] = function() {
  netAssess.map.on('draw:created', function(e) {
    if(netAssess.tutorial.active) {    
  		if(e.layerType != "marker") {
  			netAssess.tutorial.advance();
  		}
    }
	})
}

netAssess.tutorial.title[3] = "Legend";
netAssess.tutorial.target[3] = "legend";
netAssess.tutorial.position[3] = "above";
netAssess.tutorial.text[3] = "The legend does what a legend does. It tells you about the symbology of the map. You can minimize it by clicking the little bar in the upper-right. To be honest, the only reason I did this slide was to make sure that placing a slide above an object works correctly.";
netAssess.tutorial.trigger[3] = function() {
  
};

$(document).ready(function() {
  
  netAssess.tutorial.setPosition("map", "center");
   
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

  tut.slideCount++
  
  var cnt = tut.slideCount;
  
  $tut.find(".header").html(tut.title[cnt])
  $tut.find(".content").html(tut.text[cnt])
  tut.setPosition(tut.target[cnt], tut.position[cnt])
  tut.trigger[cnt]();
  
}

netAssess.tutorial.close = function() {
  netAssess.tutorial.active = false;
  $("#tutorial").css("display", "none")
  $("*").off(".tutorial");
  
}

$("#startTutorial").on("click", netAssess.tutorial.advance)
$("#tutorial .close").on("click", netAssess.tutorial.close);