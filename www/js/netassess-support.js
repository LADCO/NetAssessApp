/* Define Global Variables and Objects */

  // Continental United States Coordinates
  var us = {bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]), center: L.latLng([39.8333, -98.5833])}

  // Default icon for displaying monitor locations
  var siteIcon = L.divIcon({className: 'site-icon hidden'});
  var newSiteIcon = L.divIcon({className: 'new-site-icon'});
  var newSiteSelector = L.divIcon({className: 'fa fa-crosshairs new-site-selector'});

  // Layer containing monitor locations
  var sites = L.geoJson(null, {
        pointToLayer: function(feature, latlon) {
            var mark = new L.marker(latlon, {contextmenu: true, icon: siteIcon});
            mark.options.contextmenuItems = [{text: "Toggle Selected", index: 0, callback: toggleSelected, context: mark},
                                             {text: "Hide Monitor", index: 1, callback: hideMonitor, context: mark},
                                             {separator: true, index: 2}];
            return mark;
        },
        onEachFeature: initializeSite
      });
      
  var newSites = L.geoJson(null, {
        pointToLayer: function(feature, latlon) {
            var mark = new L.marker(latlon, {contextmenu: true, icon: newSiteIcon});
            mark.options.contextmenuItems = [{text: "Toggle Selected", index: 0, callback: toggleSelected, context: mark},
                                             {text: "Delete Monitor", index: 1, callback: hideMonitor, context: mark},
                                             {separator: true, index: 2}];
            return mark;
        },
        onEachFeature: initializeNewSite
  })
  
  var newSiteSelectionLayer = L.layerGroup();
  
  // Layer containing the area served polygons
  var areaServed = L.featureGroup(null);

  // Layer for Ozone Probabilities
  var o3prob = L.imageOverlay("images/o375.png", [[24.51748, -124.76255], [49.41748, -66.86255]], {opacity: 0.45})

  // Area of Interest Layer
  var aoi = new L.FeatureGroup();

  // Sidebar objects
  var sidebars = {
    settings: L.control.sidebar('settings-sb', {position: 'right', autoPan: false}),
    help:  L.control.sidebar('help-sb', {position: 'right', autoPan: false}),
  	about: L.control.sidebar('about-sb', {position: 'right', autoPan: false})
  }
  
  // Select Boxes
  $("#expParam").select2({width: "350px"});
  $("#areaSelectSelect").select2({width: "80%"});
  $("#new_site_parameters").select2({width: "100%", placeholder: "Click to Select Parameters"});
  
  // Floating Panel Initialization
  var cormatFloat = new $.floater("#cormat", {title: "Correlation Matrix", width: "800px", height: "640px;", top: "80px", resize: true, left: "80px"});
  var areaservedFloat = new $.floater("#areainfo", {title: "Area Served Information", top: "50px", right: "50px"});
  var aoiFloat = new $.floater("#aoi", {title: "Area of Interest"});

  var o3legendFloat = new $.floater("#o3legend", {title: "Probability", close: false, width: '150px', height: "400px", right: "50px", bottom: "50px"})
  
  var newSiteFloat = new $.floater("#new_site", {title: "Add New Site", width: '400px'})

/* Functions for Controlling the display of the map */

  // Set the dimensions of the map div to fill all available space
  function resizeMap() {
    document.getElementById("map").style.width = window.innerWidth + "px";
    document.getElementById("map").style.height = (window.innerHeight - 40) + "px";
  }
  
  // Set the map to the full extent of the continental US
  function fullExtent() {
    map.fitBounds(us.bounds);
  }
  
// Functions for controlling the display of the sites icons
  
  // Tests visible monitoring locations to see if they fall with the defined
  // area of interests. Sets properties accordingly and then updates sites layer
  function setAOI(e) {
    
    // Hack to handle both polygon and multipolygon layers
    if(e.hasOwnProperty("layer")) {
      var l = e.layer;
      var t = e.layerType;
    } else {
      var l = e;
      var t = "polygon";
    }
    
    areaServed.clearLayers();
  	aoi.clearLayers();
  	aoi.addLayer(l);
  	
  	aoi.on("click", function(l) {
  		map.fitBounds(l.layer.getBounds());
  	})
  	
  	if(t == "polygon") {
  		sites.eachLayer(checkPolygon, l);
      newSites.eachLayer(checkPolygon, l);
  	} else if(t == "rectangle") {
    	sites.eachLayer(checkPolygon, l);
      newSites.eachLayer(checkPolygon, l);
  	} else {
  		alert("Unknown Input")
  	}
    
    displaySites();
    
    var aoiPolygons = {};
    
    aoi.eachLayer(function(layer) {
      var ll = layer.getLatLngs();
      aoiPolygons[layer._leaflet_id] = ll;
    })
    
    $("#areaOfInterest").data("aoi", aoiPolygons);
    
    $("#map")
      .trigger("siteSelection")
      .trigger("aoiChange")
      .trigger("newSiteUpdate");
    
  }
  
  function checkPolygon(x) {
  
    var inside = false;
    
    if(this.hasOwnProperty("_layers")) {
      this.eachLayer(function(layer) {
        if(pip(x._latlng, layer)) {inside = true}
      })
    } else {
      inside = pip(x._latlng, this);
    }
    
  	if(inside) {
  		$(x._icon).addClass("selected");
  		x.feature.properties.selected = true;
  	} else {
  		$(x._icon).removeClass("selected");
  		x.feature.properties.selected = false;
  	}
  
  }
    
  // Function to test if point falls within a polygon
  // Converted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  function pip(point, polygon) {
    var coords = polygon._latlngs;
  	var inside = false;
  	var j = coords.length - 1
  	for(var i = 0; i < coords.length; i++) {
  		if(((coords[i].lat > point.lat) != (coords[j].lat > point.lat)) &&
  			(point.lng < (coords[j].lng - coords[i].lng) * (point.lat - coords[i].lat) / (coords[j].lat - coords[i].lat) + coords[i].lng)) {
  				inside = !inside;
  			}
  		
  		j = i;
  	}	
  	
  	return inside;
  }
  
  // A 'bridge' function that lets the setAOI function work with the predefined
  // area polygons (state, cbsa, csa). Called by a shiny custom message handler.
  function setPredefinedArea(data) {
    if(data.coords.length == 1) {
    	var x = L.polygon(data.coords[0]);
  	} else if(data.coords.length > 1) {
  		var x = L.multiPolygon(data.coords);
  	}
    disableDrawing();
    setAOI(x);	
  }

  // Function called by a shiny custom message handler when the selected
  // parameter changes. Takes a list of monitor ids from the server and changes 
  // their visible status to true, sets all sites layers to visible properties
  // to false.
  function updateVisibleMonitors(data) {
    if(!$.isArray(data)) {
      data = [data];
    }
    for(var key in sites._layers) {
      if(sites._layers.hasOwnProperty(key)) {
        var el = sites._layers[key].feature;
        var inc = false;
        for(var i = 0; i < el.properties.key.length; i++) {
          var val = el.properties.key[i]
          if(data.indexOf(val) != -1) {
            inc = true;
          }
        }
        el.properties.visible = inc;
      }
    }
    newSites.eachLayer(function(layer) {
      layer.feature.properties.visible = layer.feature.properties.Params.indexOf($("#expParam").val()) != -1;
    })
    areaServed.clearLayers()
    displaySites();
    $("#map").trigger("siteSelection")
      .trigger("newSiteUpdate")
      .trigger("siteUpdate");
    loading.hide();
  }


  // Cycles through the sites layer updating the sites based on their 'visible'
  // and 'selected' properties
  function displaySites() {
  
    sites.eachLayer(siteCheck);
    newSites.eachLayer(siteCheck);
  
  }
  
  function siteCheck(layer) {
    if(layer.feature.properties.visible == false) {
      $(layer._icon).addClass("hidden");
    } else {
      $(layer._icon).removeClass("hidden");
      if(layer.feature.properties.selected == false) {
        $(layer._icon).removeClass("selected");
      } else {
        $(layer._icon).addClass("selected");
      }
    }
  }
  
  // Function that adds the popups to the site icons and adds event triggers for 
  // shiny inputs
  function initializeNewSite(feature, layer) {
    po = "<span class = 'popup-text'><h4 class = 'popup-header'>New Site Information</h4>"
    po = po + "<span class = 'popup-header'>Site Name</span><br />"
    po = po + feature.properties.Name + "<br />"
    po = po + "<span class = 'popup-header'>State</span><br />"
    po = po + feature.properties.State + "<br />"
    po = po + "<span class = 'popup-header'>County</span><br />"
    po = po + feature.properties.County + "<br />"
    po = po + "</span>"

    layer.bindPopup(po, {minWidth: 150});

  }
  
  function initializeSite(feature, layer) {
  
    po = "<span class = 'popup-text'><h4 class = 'popup-header'>Site Information</h4>"
    po = po + "<span class = 'popup-header'>Site ID(s)</span><br />"
    for(si in feature.properties.site_id) {
      po = po + feature.properties.site_id[si] + "<br />"
    }
    po = po + "<span class = 'popup-header'>Street Address</span><br />"
    po = po + feature.properties.Street_Address + "<br />"
    po = po + "<span class = 'popup-header'>Parameter Counts</span><br />"
    po = po + "<b>Total:</b> " + feature.properties.Count + "<br />"
    po = po + "<b>Criteria:</b> " + feature.properties.Crit_Count + "<br />"
    po = po + "<b>HAPS:</b> " + feature.properties.HAP_Count + "<br />"
    po = po + "<b>Met:</b> " + feature.properties.Met_Count + "<br />"
    
    po = po + "</span>"
    
    layer.bindPopup(po, {minWidth: 150});
    layer.on("click", function(el) {
      $("#monitorSelect").data("monitor", this.feature.properties.key)
      $("#map").trigger("monitorSelect")
    })
    
  }
  
/* Call by a shiny custom message handler. Displays provided area served data */  
  function updateAreaServed(data) {
    areaServed.clearLayers()
    var areaSelectStyle = {fillColor: '#666', weight: 2, opacity: 0.75, color: 'white', dashArray: '3', fillOpacity: 0.4}
    for(var i = 0; i < data.length; i++) {
      if(data[i].coords.length == 1) {
        var a = L.polygon(data[i].coords[0], {id: data[i].id}).addTo(areaServed)
      } else {
        var a = L.multiPolygon([data[i].coords], {id: data[i].id}).addTo(areaServed)
      }
      a.setStyle(areaSelectStyle)
          .on("mouseover", function(e) {
              var layer = e.target;
              layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
              });
              if(!L.Browser.id && !L.Browser.opera) {
                layer.bringToFront();
              }
          })
          .on("mouseout", function(e) {
              e.target.setStyle(areaSelectStyle);
          })
          .on("click", function(e) {
              var layer = e.target;
              if(layer.hasOwnProperty("options")) {
                $("#clickedAreaServed").data("clicked", layer.options.id)
              } else if(layer.hasOwnProperty("_options")) {
                $("#clickedAreaServed").data("clicked", layer._options.id)
              }
              areaservedFloat.open();
              $("#map").trigger("areaClick")
          })
    }
    loading.hide();
  }

/* Miscellaneous Functions */

  // Function that resets the predefined area. Used mainly on page reload to 
  // prevent the predefined area displaying by default.
  function resetPredefinedAreaSelect() {
    $('input[name=areaSelect]').attr('checked', false);
    document.getElementById('areaSelectSelect').selectedIndex = -1;
  }
  
  // Set of functions to show/hide the loading animation
  var loading = {
    show: function() {
      $("div.loading").removeClass("hidden");
    },
    hide: function() {
      $("div.loading").addClass("hidden");
    }
  }
  
  // Reset the App
  function resetApp() {
    loading.show();
    resetPredefinedAreaSelect();
    $("#expParam").select2("val", "-1")
    $("#expParam").trigger("change");
    aoi.clearLayers();
    areaServed.clearLayers();
    aoiFloat.close();
    areaservedFloat.close();
    cormatFloat.close();
    fullExtent();
    loading.hide();
    $("input[name='areaServedClipping'][value='border']").prop("checked", true);
    $("#areaServedClipping").trigger('change.radioInputBinding');
    sites.eachLayer(function(layer) {
      layer.feature.properties.visible = false;
      layer.feature.properties.selected = false;
    })
  }
  
  // Functions for changing the state of monitoring locations
  
  function toggleSelected() {
    this.feature.properties.selected = !this.feature.properties.selected
    $(this._icon).toggleClass("selected", this.feature.properties.selected);
    $("#map").trigger("siteSelection").trigger("newSiteUpdate");
  }

  function hideMonitor() {
    this.feature.properties.visible = false;
    this.feature.properties.selected = false;
    $(this._icon).addClass("hidden");
    $("#map")
      .trigger("siteSelection")
      .trigger("siteUpdate")
      .trigger("newSiteUpdate");
  }
  
  // Toggles the provided sidebar panel, and makes sure all others are closed.
  function toggleSidebars(sb) {
    for(var x in sidebars) {
  		if(sidebars.hasOwnProperty(x)) {
  			if(x == sb) {
  				sidebars[sb].toggle();
  			} else {
  				sidebars[x].hide();
  			}
  		}
  	};
  }
  
  // Turn off any currently active drawing handlers
  function disableDrawing() {
    draw_polygon.disable();
    draw_rectangle.disable();
  }
  
  // Function to update and show the alert box
  function showAlert(heading, body) {
    $("#alert-heading").html(heading);
    $("#alert-body").html(body);
    $("#alert").addClass("alert-open");
  }
  
/* Functions to do error checking on inputs before sending data to shiny server */

function checkBasics(siteMax, siteMin) {
  
  var active = true;
  var body = "Please correct the following problems:<ul>";
  
  if($("#expParam").select2("val") == "-1") {
    active = false;
    body = body + "<li>No parameter selected</li>"
  }
  
  var ss = 0;
  
  sites.eachLayer(function(layer, feature) {
    if(layer.feature.properties.selected && layer.feature.properties.visible) {
      ss++;
    }
  })   
  
  if(ss == 0) {
    active = false;
    body = body + "<li>No monitors selected</li>";
  } else if(ss < siteMin && siteMin != 1) {
    active = false;
    body = body + "<li>Too few monitors selected</li>";
  }else if(ss > siteMax) {
    active = false;
    body = body + "<li>Too many monitors selected</li>";
  }
  
  return {active: active, body: body};

}

function checkAreaServed(event) {
  event.stopPropagation();
  var bc = checkBasics(300, 1);

  if(bc.active) {
    loading.show();
    $("#areaServedCalcButton").trigger(event);
  } else {
    bc.body = bc.body + "</ul>";
    showAlert("Area Served Error", bc.body)
  }
    
}

function checkCorMat(event) {
  var bc = checkBasics(30, 3);

  var param = $("#expParam").select2("val");
  var vp = ["44201", "88101", "88502"];
  if(vp.indexOf(param) == -1) {
    bc.active = false;
    bc.body = bc.body + "<li>Correlation matrices are only available for parameter codes 44201, 88101, and 88502.</li>"
  }
  
  if(bc.active) {
    cormatFloat.open()
  } else {
    bc.body = bc.body + "</ul>";
    showAlert("Correlation Matrix Error", bc.body)
  }
}

function checkReport(event) {
  event.stopPropagation()
  var active = true;
  if(active == true) {
    $("#downloadData").trigger(event);
  }
}

function populateNewSiteData(event) {
  
  event.layer.addTo(newSiteSelectionLayer);
  
  $("#ns_lat").val(Math.round(event.layer._latlng.lat * 10000) / 10000);
  $("#ns_lng").val(Math.round(event.layer._latlng.lng * 10000) / 10000);
  
  var lat = event.layer._latlng.lat;
  var lng = event.layer._latlng.lng;
  var url = "http://data.fcc.gov/api/block/find?latitude=" + lat + "&longitude=" + lng + "&showall=false&format=jsonp&callback=?"
  $.getJSON(url, function(wd) {
    
    $("#ns_state").val(wd.State.name);
    $("#ns_county").val(wd.County.name);
    newSiteFloat.open();

  })

}

function addNewSite() {
  newSiteSelectionLayer.eachLayer(function(layer) {
    var gj = layer.toGeoJSON();
    var props = {County: $("#ns_county").val(), State: $("#ns_state").val(), 
                 Name: $("#ns_name").val(), Params: $("#new_site_parameters").val(),
                 key: new_site_count
                }
    new_site_count++
    props.selected = false;
    props.visible = props.Params.indexOf($("#expParam").val()) != -1;
    gj.properties = props;
    newSites.addData(gj)
    newSites.eachLayer(siteCheck);
  })
  $("#map").trigger("newSiteUpdate");
  newSiteSelectionLayer.clearLayers();
  newSiteFloat.close();
}