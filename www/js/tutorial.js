netAssess.tutorial = {text: [], title: [], target: [], position: [], trigger: [], slideCount: -1, left: 0, top: 0, width: 400, height: 300, active: true};

netAssess.tutorial.title[0] = "Parameter of Interest"
netAssess.tutorial.target[0] = "s2id_expParam"
netAssess.tutorial.position[0] = "below";
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
  			netAssess.tutorial.close();
  		}
    }
	})
}

$(document).ready(function() {
  
  var $tut = $("#tutorial");
  
  var rect = document.getElementById("map").getBoundingClientRect();
  
  netAssess.tutorial.left = ((rect.right - rect.left) / 2) - (netAssess.tutorial.width / 2);
  netAssess.tutorial.top = ((rect.bottom - rect.top) / 2) - (netAssess.tutorial.height / 2);
  $tut.css({top: netAssess.tutorial.top, left: netAssess.tutorial.left, display: "block"})
  
})

netAssess.tutorial.positions = {
  below: function(target) {
    var rect = document.getElementById(target).getBoundingClientRect();
    var position = {
      left: rect.left,
      top: rect.bottom + 10
    }
    return position;
  },
  right: function(target) {
    var rect = document.getElementById(target).getBoundingClientRect();
    var position = {
      left: rect.right + 10,
      top: rect.top
    }
    return position;
    
  }
  
}

netAssess.tutorial.advance = function() {
  
  var tut = netAssess.tutorial;
  var $tut = $("#tutorial");

  tut.slideCount++
  
  var cnt = tut.slideCount;
  
  $tut.find(".header").html(tut.title[cnt])
  $tut.find(".content").html(tut.text[cnt])
  var pos = tut.positions[tut.position[cnt]](tut.target[cnt])
  $tut.css(pos);
  tut.trigger[cnt]();
  
}

netAssess.tutorial.close = function() {
  netAssess.tutorial.active = false;
  $("#tutorial").css("display", "none")
  $("*").off(".tutorial");
  
}

$("#startTutorial").on("click", netAssess.tutorial.advance)
$("#tutorial .close").on("click", function() {
});