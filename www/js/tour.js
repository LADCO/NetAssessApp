netAssess.tour = {slides: [], slideCount: 0, width: 400, height: 300, active: true}

netAssess.tour.makeSlide = function(options) {
  
  options = $.extend({
    position: "center",
    title: "NetAssess",
    text: "Welcome to NetAssess!",
    target: "#map",
    runbefore: function() {},
    runafter: function() {}
  }, options)

  netAssess.tour.slides.push(options)
  
}

netAssess.tour.makeSlide({text: "This tool is meant to assist with 5-year Network Assessments as required by <a href = 'http://www.ecfr.gov/cgi-bin/text-idx?SID=1c02841c6e1ad0e7e8ecaa87954ac180&node=se40.6.58_110&rgn=div8' target='_blank'>40 CFR &#0167;58.10(d)</a>.<p> You can start by running through this quick tour, or close this box with the 'x' in the top right corner and jump right in to the tool. Refer to the <a href = 'http://ladco.github.io/NetAssessApp/' target='_blank'>Guidance Document</a> for more detailed information about the App.</p>"})
                             
netAssess.tour.makeSlide({title: "Menu Bar",
                          text: "<p>We will begin with a tour of the page and how it is organized.</p><p>This is the menu bar. It is how you will access most of the functionality of the tool.</p>",
                          target: "#menubar",
                          position: "below"
                          })
                          
netAssess.tour.makeSlide({title: "Navigation",
                          text: "This button can be used to zoom in to your area of interest, once you have defined one.",
                          target: "#aoiZoomButton",
                          position: "below"
                          })
                          
netAssess.tour.makeSlide({title: "Navigation",
                          text: "And this button will zoom you out to view the entire Continental United States. We will cover the other buttons later.",
                          target: "#fullExtentButton",
                          position: "below"
                          })
                          
netAssess.tour.makeSlide({title: "Layers",
                          text: "<p>This is the Layers control. Use it to switch between different basemaps and to turn different tool layers on and off.",
                          target: ".leaflet-control-layers-toggle",
                          position: "right"
                          })

netAssess.tour.makeSlide({title: "More Options",
                          text: "These buttons open side panels that offer additional setting and information.",
                          target: ".leaflet-top.leaflet-right",
                          position: "left"
})

netAssess.tour.makeSlide({title: "Legend",
                          text: "This is the legend. It explains what the symbols on the map mean. Pay attention to the legend because it will change depending on which tools your are using, and which layers you have displayed.",
                          target: "#legendFloater",
                          position: "above"
                          })

netAssess.tour.makeSlide({title: "Getting Started",
                          text: "Now we will cover how to get started using the tools. <strong>Important</strong> The following steps do not require you to make any selections. The app will make appropriate selections to illustrate the functionality. Please only press the 'Next' button when you are ready to move to the next step."
                          })
netAssess.tour.makeSlide({title: "Parameter of Interest",
                          text: "The first step in the assessment process should be selecting a parameter of interest. You do that with the parameter selection dropdown to the right. You can scroll through the list to find your parameter or use the search box to search by name or AQS code. Once you select a parameter the map will update to show the locations of known sites monitoring for that parameter. We have selected <b>44201 - OZONE</b> for this example.", 
                          target: "#s2id_paramOfInterest", 
                          position: "left",
                          runbefore: 
                            function() {
                              if($("#paramOfInterest").select2("val") != "44201") {
                                $("#paramOfInterest").select2("val", "44201");
                                $("#paramOfInterest").trigger("change");
                              }
                            }
                          })
                             
netAssess.tour.makeSlide({title: "Sites",
                          text: "Once a parameter of interest is selected, All the sites that monitor for that parameter will be displayed as red circles on the map. You can click on a site to open a popup that contains basic information about that site including the AQS Site ID, the address, basic information about what is monitored there, and, if you have selected a criteria pollutant, a graph depicting the last ten years of design values for that site."
})
                             
netAssess.tour.makeSlide({title: "Area of Interest",
                          text: "Next you will need to select an Area of Interest. This allows you to focus your analysis on a specific area of the country. You can open the <b>Area of Interest Dialog</b> by clicking the <i class = 'fa fa-crosshairs'></i> button above. ", 
                          target: "#aoiButton", 
                          position: "below",
                          runafter: netAssess.floaters.aoi.open});
                          
netAssess.tour.makeSlide({title: "Area of Interest",
                          text: "From the Area of Interest dialog you can select an area of interest in several ways. You can draw an area free-hand, from the 'Draw an Area of Interest' area.<table style = 'padding-top: 5px'><tr><td style = 'vertical-align: top'><img src='images/glyphicons_096_vector_path_polygon.png'></td><td style = 'padding-left: 5px'>Allows you to draw a many-sided polygon by clicking the map where vertices should be. Click the location of your first vertex to close the polygon and finalize the shape.</td></tr><tr><td style = 'vertical-align: top'><img src='images/glyphicons_094_vector_path_square.png'></td><td style = 'padding-left: 5px'>Allows you to define a rectangular area by clicking a dragging over the area you are interested in on the map.</td></tr><tr><td style = 'vertical-align: top'><img src='images/glyphicons_197_remove.png'></td><td style = 'padding-left: 5px'>If you start a drawing and change you mind, this allows you to cancel the drawing.</td></table>", 
                          target: "#cancelDrawButton", 
                          position: "right"})

netAssess.tour.makeSlide({title: "Area of Interest",
                          text: "Or you can also select a predefined area such as a State, CBSA, or CSA. <ol><li>Click the cicle to the left of the Area Type you want.</li><li>The dropdown will update to reflect you choice.</li><li>Use the dropdown to select the specific area you are interested in.</li></ol> You can scroll through the list to locate your area, or use the text box to filter your choices. We will select the state of <b>North Dakota</b>.", 
                          target: "#areaSelect", 
                          position: "right",
                          runbefore:
                            function() {
                              $("[name='areaSelect'][value='State']").trigger("click");
                              setTimeout(function() {
                                $("#areaSelectSelect").select2("val", "38");
                                $("#areaSelectSelect").trigger("change");
                              }, 500)
                            },
                          runafter: netAssess.floaters.aoi.close
                          })

netAssess.tour.makeSlide({title: "Site Selection",
                          text: "Notice that the sites within your area of interest have gotten brighter and larger to indicate that they are selected. You can also right-click on sites to open a menu that allows you to select, deselect, or hide those sites individually."
                          })

netAssess.tour.makeSlide({title: "New Sites",
                          text: "At this point you may want to add new sites to your monitoring network. This can be done with the new sites tool. Click this button, then click the location on the map where you want the new monitor to be placed. The app will then figure out the state, county, and census tract of the location you selected and ask you for a name, and which pollutants you want to monitor there. New sites are depicted as green circles and are treated just like regular site for the purposes of area served calculations.",
                          target: "#newSiteButton",
                          position: "below"
                          })

netAssess.tour.makeSlide({title: "Area Served",
                          text: "Area Served provides information about the area surrounding monitors in you area of interest. Clicking the button will calculate the area served by each monitor and draw polygons on the map representing those areas. You can then click on a polygon to get more information about that area.",
                          target: "#areaServedButton",
                          position: "below",
                          runafter: function() {
                            $("#areaServedButton").trigger("click");
                          }
                          })

netAssess.tour.makeSlide({title: "Area Served",
                          text: "In a moment, grey polygons will appear around the selected sites. Each grey polygon represents the area that is closer to the monitor within it than any other monitor in the network. Clicking on a polygon will open a new dialog with information about that area.",
                          runafter: function() {
                            var key = Object.keys(netAssess.layerGroups.areaServed._layers)[1];
                            netAssess.layerGroups.areaServed._layers[key].fire("click");
                          }
                          })

netAssess.tour.makeSlide({title: "Area Served Information",
                          text: "The Area Served Information dialog gives you geographic and demographic information about the the area you clicked.", 
                          target: "#areaServedFloater",
                          position: "left"
                          })

netAssess.tour.makeSlide({title: "Area Served Information",
                          text: "This includes charts that break the population down by age and race, for potental environmental justice analysis. You can click these plots to see larger versions.",
                          target: "#areaServedAgePlot",
                          position: "left"
                          })
netAssess.tour.makeSlide({title: "Area Served Information",
                          text: "If you have selected Ozone or PM<sub>2.5</sub> you will also be given the exceedence probability of the census tract with the highest exceedence probability found within the area served by the site.",
                          target: "#naaqsProb",
                          position: "left",
                          runafter: netAssess.floaters.areaServed.close
                          })
netAssess.tour.makeSlide({title: "Correlation Matrix",
                          text: "<p>The correlation matrix gives you information about how concentrations at monitors within your area of interest compare to one another. This tool currently only works with</p><ul><li><b>44201 - OZONE</b></li><li><b>88101 - PM2.5 - LOCAL CONDITIONS</b></li><li><b>88502 - ACCEPTABLE PM2.5 AQI & SPECIATION MASS</b></li></ul>", 
                          target: "#cormatButton", 
                          position: "below",
                          runafter:
                            function() {
                              $("#cormatButton").trigger("click");
                            }
                          })

netAssess.tour.makeSlide({title: "Correlation Matrix",
                          text: "The correlation matrix will open to the left. Each monitor-monitor comparison is represented by an ellipse. The eccentricity (flatness) of the ellipse represents the correlation between the monitors. (Flatter equals more correlation), the color of the ellipse represents the average relative difference between the monitors, and the number inside the ellipse is the distance, in kilometers, between the two monitors.",
                          target: "#cormatFloater", 
                          position: "right",
                          runafter: netAssess.floaters.cormat.close
                          });
                          
netAssess.tour.makeSlide({title: "Removal Bias",
                          text: "The removal bias tool finds the nearest neighbors to each selected monitor and then uses the concentrations at that those sites to interpolate the concentration at the monitoring site using and inverse distance weighted average. It then compares that interpolation to the actual concentrations measured at the site. If there is little difference (low bias) that may indicate that the monitor is redundant and could be removed. This tool is only available for: <ul><li><b>44201 - OZONE</b></li><li><b>88101 - PM2.5 - LOCAL CONDITIONS</b></li><li><b>88502 - ACCEPTABLE PM2.5 AQI & SPECIATION MASS</b></li></ul>.",
                          target: "#rembiasButton",
                          position: "below",
                          runbefore: function() {
                            $("#rembiasButton").trigger("click");
                          }
                          })
netAssess.tour.makeSlide({title: "Removal Bias",
                          text: "Once the tool has run, the sites with data available will become larger and colored differently. The color represents the mean removal bias calculated for that site. Shades of red represent positive bias, while blues represent negative bias. The darker the color, the more removal bias. Refer to the legend for interpretation of the colors. Clicking on a site will open a popup that gives more information about the removal bias at that location."
                          })
                          
netAssess.tour.makeSlide({title: "Download Data",
                          text: "All data calculated by the NetAssess app is available for download as csv files. Clicking this button will open a dialog where you can chose the data you want to download",
                          target: "#downloadDataButton",
                          position: "below",
                          runafter: netAssess.floaters.download.open
                          })

netAssess.tour.makeSlide({title: "Download Data",
                          text: "Click the download icon next to a data type to download that data. If the data type is greyed out that mean that you haven't made sufficient selections to generate that data yet.",
                          target: "#downloadFloater",
                          position: "below",
                          runafter: netAssess.floaters.download.close
                          })
                          

netAssess.tour.makeSlide({title: "Conclusion",
                          text: "This is the end of the tour for now. If you feel like we have left something important out, please let us know.<p>You can check the 'Don't show again' box below to prevent this tour from opening automatically the next time you visit the app. You can always reopen it from the 'Help' sidebar to the right."})

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
    netAssess.tour.active = true;
    document.getElementById("tourGone").checked = false;
  } else {
    netAssess.tour.active = false;
    document.getElementById("tourGone").checked = true;
  }
  
  if(netAssess.tour.active) {
    netAssess.tour.advance()
  }
   
})

netAssess.tour.setPosition = function(target, position) {
  
  var rect = $(target)[0].getBoundingClientRect();

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
        top: rect_center.y - (netAssess.tour.height / 2),
        left: rect_center.x - (netAssess.tour.width / 2),
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
        top: rect.top - (netAssess.tour.height + 15),
        left: rect_center.x - (netAssess.tour.width / 2),
        display: "block"
      };
      arrowPos.top = netAssess.tour.height - 5;
      arrowPos.left = netAssess.tour.width / 2;
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
        left: rect_center.x - (netAssess.tour.width / 2),
        display: "block"
      };
      arrowPos.top = -20;
      arrowPos.left = (netAssess.tour.width / 2) - 10;
      arrowPos.display = "block";
      arrowPos["border-bottom-color"] = "#EFEFEF";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      arrowBorderPos.top = arrowBorderPos.top - 2.5
      arrowBorderPos["border-bottom-color"] = "black";
      break;
      
    case "left":
      var position = {
        top: rect_center.y - (netAssess.tour.height / 2),
        left: rect.left - (netAssess.tour.width + 15),
        display: "block"
      }
      arrowPos.top = (netAssess.tour.height / 2) - 10;
      arrowPos.left = netAssess.tour.width - 5;
      arrowPos.display = "block";
      arrowPos["border-left-color"] = "#EFEFEF";
      var arrowBorderPos = {};
      $.extend(arrowBorderPos, arrowPos);
      arrowBorderPos.left = arrowBorderPos.left + 2.5;
      arrowBorderPos["border-left-color"] = "black";
      break;
      
    case "right":
      var position = {
        top: rect_center.y - (netAssess.tour.height / 2),
        left: rect.right + 15,
        display: "block"
      }
      arrowPos.top = (netAssess.tour.height / 2) - 10;
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
  
  var w = window.innerWidth;
  var h = window.innerHeight;
  
  if(position.left < 0) {
    var offset_x = 5 + (position.left + netAssess.tour.width);
  } else if((position.left + netAssess.tour.width) > w) {
    var offset_x = 5 + ((position.left + netAssess.tour.width) - w);
  } else {
    var offset_x = 0;
  }
  
  position.left = parseInt(position.left - offset_x, 10) + "px";
  arrowPos.left = parseInt(arrowPos.left + offset_x, 10) + "px";
  arrowBorderPos.left = parseInt(arrowBorderPos.left + offset_x, 10) + "px";
  
  if(position.top < 0) {
    var offset_y = 5 - position.top; 
  } else if((position.top + netAssess.tour.height) > h) {
    var offset_y = (position.top + netAssess.tour.height) - h;
  } else {
    var offset_y = 0;
  }

  position.top = parseInt(position.top + offset_y, 10) + "px";
  arrowPos.top = parseInt(arrowPos.top - offset_y, 10) + "px";
  arrowBorderPos.top = parseInt(arrowBorderPos.top - offset_y, 10) + "px";

  var $tour = $("#tour");
  $tour.css(position);
  $tour.find(".tour-arrow").css(arrowPos);
  $tour.find(".tour-arrow-border").css(arrowBorderPos);
  
}

netAssess.tour.advance = function() {
  
  var tour = netAssess.tour;
  var $tour = $("#tour");
  
  var cnt = tour.slideCount;
  
  if(cnt > 0) tour.slides[cnt - 1].runafter();
  tour.slides[cnt].runbefore();

  $tour.find(".header").html(tour.slides[cnt].title);
  $tour.find(".content")[0].scrollTop = 0;
  $tour.find(".content").html(tour.slides[cnt].text);
  tour.setPosition(tour.slides[cnt].target, tour.slides[cnt].position);
  


  tour.slideCount++
  
}

netAssess.tour.close = function() {
  netAssess.tour.active = false;
  $("#tour").css("display", "none")
  $("*").off(".tour");
}

$("#tourNext").on("click", function() {
  
  if(netAssess.tour.slideCount == netAssess.tour.slides.length - 1) {
    $("#tourNext").text("Close")
  } else {
    $("#tourNext").text("Next")
  }
  if(netAssess.tour.slideCount == netAssess.tour.slides.length) {
    netAssess.tour.close()
  } else {
    netAssess.tour.advance()
  }
  
})

$("#tour .close").on("click", netAssess.tour.close);

$("#tour #tourGone").on("click", function(e) {
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
  if(netAssess.tour.active == false) {
    netAssess.tour.slideCount = 0;
    netAssess.tour.active = true;
    netAssess.tour.advance();
    netAssess.sidebars.help.hide();
  }
})

// Disabled the Next button until the page has a chance to load to avoid the 
// user clicking it too early and messing everything up...
$("#tourNext").attr("disabled", true);
$(document).ready(function() {
  setTimeout(function() {$("#tourNext").attr("disabled", false)}, 1500)
})  