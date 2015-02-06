netAssess.resizeMap = function() {
	document.getElementById("map").style.width = window.innerWidth + "px";
	document.getElementById("map").style.height = (window.innerHeight - 40) + "px";
}

$(window).resize(function() {
  netAssess.resizeMap();
})

netAssess.resizeMap();

netAssess.data = {
  us_bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]),
  newSiteCounter: 90001,
  newSites: {},
  biasLayers: []
}

netAssess.loading = {
  show: function() {
    $("div.loading").removeClass("hidden");
  },
  hide: function() {
    $("div.loading").addClass("hidden");
  }
}

netAssess.loading.show();

netAssess.basemaps = {
	"Gray": L.layerGroup([L.esri.basemapLayer("Gray"), L.esri.basemapLayer("GrayLabels")]),
	"Street": L.esri.basemapLayer("Streets"),
	"Satellite" : L.esri.basemapLayer("Imagery"),
	"Satellite - Labelled": L.layerGroup([L.esri.basemapLayer("Imagery"), L.esri.basemapLayer("ImageryLabels")])
}

netAssess.overlays = {
	o3: L.imageOverlay("images/o3_75.png", [[24.51748, -124.76255], [49.38436, -66.92599]], {opacity: 0.65}),
	pm25: L.imageOverlay("images/pm25_35.png", [[24.51748, -124.76255], [49.38436, -66.92599]], {opacity: 0.65})
}

netAssess.layerGroups = {}
netAssess.layerGroups.aoi = L.featureGroup(null);
netAssess.layerGroups.rembias = L.featureGroup(null);
netAssess.layerGroups.newSiteSelection = L.layerGroup();
netAssess.layerGroups.areaServed = L.featureGroup(null);
netAssess.layerGroups.cormap = L.featureGroup(null);
netAssess.layerGroups.sites = L.siteGroup({
  aoiLayer: netAssess.layerGroups.aoi,
  correlations: true,
  onEachSite: function(site) {
      po = "<span class = 'popup-text'><h4 class = 'header'>Site Information</h4>"
      po = po + "<center><table class = 'popup-table'><tr>"
      
      po = po + "<td>Site ID(s)</td><td>"
    	for(si in site.properties.site_id) {
    	  po = po + site.properties.site_id[si] + "<br />"
    	}
      po = po + "</td></tr>"
      
      po = po + "<tr><td>Street Address</td>"
    	po = po + "<td>" + site.properties.Street_Address + "</td></tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; padding-top: 5px; border-right: none;'>Parameter Counts</td></tr>"
      po = po + "<tr><td>Total</td><td>" + site.properties.Count + "</td></tr>"
    	po = po + "<tr><td>Criteria:</td><td>" + site.properties.Crit_Count + "</td></tr>"
    	po = po + "<tr><td>HAPS:</td><td>" + site.properties.HAP_Count + "</td></tr>"
    	po = po + "<tr><td>Met:</td><td>" + site.properties.Met_Count + "</td></tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; padding-top: 10px; border-right: none;'>Design Value Trends</td></tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; border-right: none;'><div class = 'popup-trend'><img src = 'images/notrend.png' /></div></center></td></tr>"
      po = po + "</table>"
    	po = po + "</span>"
      
      site.bindPopup(po, {minWidth: 150});

  }
})
netAssess.layerGroups.newSites = L.siteGroup({
    contextmenu: true,
    aoiLayer: netAssess.layerGroups.aoi,
    visibilityTest: function(site) {
      return (site.properties.Params.indexOf($("#paramOfInterest").val()) != -1) 
    },
    onEachSite: function(site) {
      po = "<span class = 'popup-text'><h4 class = 'header'>New Site Information</h4>"
      po = po + "<center><table class = 'popup-table'><tr>"
      
      po = po + "<td>Site ID</td><td>" + site.properties.Name + "</td></tr>"
      po = po + "<tr><td>County</td><td>" + site.properties.County + "</td></tr>"
      po = po + "<tr><td>State</td><td>" + site.properties.State + "</td></tr>"

      po = po + "<tr><td>Parameters</td><td>"
      for(var i = 0; i < site.properties.Params.length; i++) {
        po = po + site.properties.Params[i] + "<br />"
      }
      po = po + "</td></tr>"

      po = po + "</table></span>"
  
      site.bindPopup(po, {minWidth: 150});

    },
    styles: {
      selected: {radius: 5, opacity: 0.67, fillOpacity: 0.67, fillColor: "#40ff40", color: "#000", weight: 1},
      unselected: {radius: 4, opacity: 0.67, fillOpacity: 0.67, fillColor: "#008000", color: "#000", weight: 1}
    }
  })

netAssess.floaters = {
  aoi: $.floater("#aoiFloater", {title: "Area of Interest"}),
  newSite: $.floater("#newSiteFloater", {title: "New Site", close: false, minimize: false}),
  areaServed: $.floater("#areaServedFloater", {title: "Area Served Information", top: "50px", right: "50px"}),
  cormat: $.floater("#cormatFloater", {title: "Correlation Matrix", width: "800px", height: "640px", top: "80px", resize: true, left: "80px"}),
  popup: $.floater("#popupFloater", {title: "Popup", width: "600px", left: "200px", resize: true, minimize: false}),
  legend: $.floater("#legendFloater", {title: "Legend", close: false, width: '400px',  right: '50px', bottom: '50px'}),
  download: $.floater("#downloadFloater", {title: "Download Data", minimize: false, width: "300px", top: "50px", left: "40%"})
}

$("#aoiButton").on("click", netAssess.floaters.aoi.open)
$("#downloadDataButton").on("click", netAssess.floaters.download.open)

$("#newSiteButton").on("click", function(e) {
  netAssess.layerGroups.newSiteSelection.clearLayers();
  netAssess.draw.newSite.enable();
})

netAssess.map = L.map("map", {
  contextmenu: true,
  contextmenuWidth: 140,
  contextmenuItems: [
    {text: "Full Extent", iconCls: "fa fa-serach-minus", callback: netAssess.zoomOut}  
  ],
  zoomControl: false,
  maxZoom: 12,
  minZoom: 3
})

netAssess.draw = {
  polygon: new L.Draw.Polygon(netAssess.map, {allowInterSection: false, showArea: false, drawError: {color: '#b00b00', timeout: 1000}, shapeOptions: {color: '#0033ff', fill: false}}),
  rectangle: new L.Draw.Rectangle(netAssess.map, {shapeOptions: {color: '#0033ff', fill: false}}),
  disable: function() {
    netAssess.draw.polygon.disable();
	  netAssess.draw.rectangle.disable();
  },
  newSite: new L.Draw.Marker(netAssess.map, {icon: L.divIcon({className: 'fa fa-crosshairs new-site-selector'})})
}

$("#drawPolygonButton").on('click', function() {
  netAssess.draw.disable();
	netAssess.draw.polygon.enable()
});
	  
$("#drawRectangleButton").on('click', function() {
	netAssess.draw.disable();
	netAssess.draw.rectangle.enable()
});
  
$("#cancelDrawButton").on('click', netAssess.draw.disable);

netAssess.map.on('draw:created', function(e) {
  if(e.layerType == "marker") {
    netAssess.getNewSite(e.layer)
  } else {
    netAssess.setAOI(e.layer)
    netAssess.layerGroups.areaServed.clearLayers();
    $("#areaSelect0").click();
    
  }
})

netAssess.setAOI = function(aoi) {
  netAssess.layerGroups.aoi.clearLayers();
  aoi.addTo(netAssess.layerGroups.aoi);
  var aoiPolygons = {};
  netAssess.layerGroups.aoi.eachLayer(function(layer) {
    if(layer.hasOwnProperty("_layers")) {
      layer.eachLayer(function(sublayer) {
        var ll = sublayer.getLatLngs();
        aoiPolygons[sublayer._leaflet_id] = ll;
      })
    } else {
  		var ll = layer.getLatLngs();
  		aoiPolygons[layer._leaflet_id] = ll;
    }
	})
  document.getElementById("areaOfInterest").updateAnchor(aoiPolygons);
}

netAssess.getNewSite = function(newSite) {
  
    newSite.addTo(netAssess.layerGroups.newSiteSelection)
  
    var lat = newSite._latlng.lat;
    var lng = newSite._latlng.lng;
  
    $("#nsLat").val(Math.round(lat * 10000) / 10000);
	  $("#nsLng").val(Math.round(lng * 10000) / 10000);
    
    var url = "https://data.fcc.gov/api/block/find?latitude=" + lat + "&longitude=" + lng + "&showall=false&format=jsonp&callback=?"

    $.getJSON(url, function(wd) {
      
  		$("#nsState").val(wd.State.name);
  		$("#nsCounty").val(wd.County.name);
      $("#nsCensus").val(wd.Block.FIPS.substring(0,11));
  		netAssess.floaters.newSite.open();
  
  	})  
}

netAssess.setNewSite = function(e) {

  var latlng = L.latLng({lat: $("#nsLat").val(), lng: $("#nsLng").val()});

  var props = {County: $("#nsCounty").val(), State: $("#nsState").val(), 
  		         Name: $("#nsName").val(), Params: $("#newSiteParameters").val(),
               Tract: $("#nsCensus").val(),	key: netAssess.data.newSiteCounter
	            }
              
  var opts = {contextmenu: true}
             
  netAssess.data.newSiteCounter++
  
//  document.getElementById("newSitesAnchor").updateAnchor({type: "add", coords: latlng, properties: props})
  
  netAssess.layerGroups.newSites.addSite(latlng, props, opts)
  netAssess.layerGroups.newSiteSelection.clearLayers();
  netAssess.floaters.newSite.close();

  netAssess.data.newSites[props.key] = {key: props.key, lat: latlng.lat, lng: latlng.lng, properties: props}
  document.getElementById("newSites").updateAnchor(netAssess.data.newSites)

}

$("#cancelSiteAddButton").on("click", function(e) {
  netAssess.layerGroups.newSiteSelection.clearLayers();
  netAssess.floaters.newSite.close();
});

$("#newSiteAddButton").on("click", netAssess.setNewSite);

netAssess.basemaps.Gray.addTo(netAssess.map)

netAssess.zoomOut = function() {
  netAssess.map.fitBounds(netAssess.data.us_bounds);
}

netAssess.zoomOut()

$("#fullExtentButton").on("click", netAssess.zoomOut)

// Add the layers control
L.control.layers(netAssess.basemaps, 
  {"Area of Interest": netAssess.layerGroups.aoi,
   "Area Served": netAssess.layerGroups.areaServed,
   "Ozone Probability": netAssess.overlays.o3,
   "PM<sub>2.5</sub> Probability": netAssess.overlays.pm25,
   "Removal Bias": netAssess.layerGroups.rembias,
   "Correlations": netAssess.layerGroups.cormap
  }, {position: 'topleft'}).addTo(netAssess.map);

$.ajax({
  dataType: "json",
  url: "data/sites.geojson",
  success: function(data) {
    var d = netAssess.layerGroups.sites.addGeoJSON(data)
    window.setTimeout(function() {
      for(var i = 0; i < netAssess.data.biasLayers.length; i++) {
        netAssess.addBiasLayer(netAssess.data.biasLayers[i])
      }
      netAssess.loading.hide();
    }, 1000)
  }
});

netAssess.layerGroups.areaServed.addTo(netAssess.map);
netAssess.layerGroups.sites.addTo(netAssess.map).bringToFront();
netAssess.layerGroups.newSites.addTo(netAssess.map).bringToFront();
netAssess.layerGroups.newSiteSelection.addTo(netAssess.map);
$("#paramOfInterest").select2({width: "300px", height: "24px;"});
$("#areaSelectSelect").select2({width: "80%"});
$("#newSiteParameters").select2({width: "100%", placeholder: "Click to Select Parameters"});

$("#paramOfInterest").on("change", function(e) {
  netAssess.layerGroups.newSites.testVisibility();
  netAssess.layerGroups.rembias.clearLayers();
  netAssess.layerGroups.cormap.clearLayers();
  netAssess.layerGroups.areaServed.clearLayers();
  var val = $("#paramOfInterest").select2("val")
  if(["44201", "88101", "88502"].indexOf(val) != -1) {
    netAssess.layerGroups.sites.options.correlations = true;
  } else {
    netAssess.layerGroups.sites.options.correlations = false;
  }
  document.getElementById("cormapSite").updateAnchor(null);
});

$("#areaServedType").on("change", function(e) {
  if($("#areaServedType").val() == "voronoi") {
    $("#circleSize").attr("disabled", "disabled")
  } else {
    $("#circleSize").attr("disabled", false)
  }
})

$("#areaServedAgePlot, #areaServedRacePlot").on("click", function(event) {
    $("#bigChart").attr("src", $(this).find("img").attr("src"))
    netAssess.floaters.popup.open();
})
    
$("#areaServedButton").on("click", function(event) {
  netAssess.errorChecking.areaServed(event);
})

$("#cormatButton").on("click", function(event) {
  netAssess.errorChecking.cormat(event);
})

$("#rembiasButton").on("click", function(event) {
  netAssess.errorChecking.rembias(event);
})


netAssess.errorChecking = {};

netAssess.errorChecking.basics = function(siteMax, siteMin) {
  var active = true;
	var body = "Please correct the following problems:<ul>";
  
	if($("#paramOfInterest").select2("val") == "-1") {
		active = false;
		body = body + "<li>No parameter selected</li>"
	}
  
	var activeSites = 0;
  
  var vs = netAssess.layerGroups.sites.options.visibleSites.concat(netAssess.layerGroups.newSites.options.visibleSites);
  var ss = netAssess.layerGroups.sites.options.selectedSites.concat(netAssess.layerGroups.newSites.options.selectedSites);
  
  for(var i = 0; i < ss.length; i++) {
    if(vs.indexOf(ss[i]) != -1) {
      activeSites++
    }
  }
  
	if(activeSites == 0) {
		active = false;
		body = body + "<li>No sites selected</li>";
	} else if(activeSites < siteMin && siteMin != 1) {
		active = false;
		body = body + "<li>Too few sites selected. Please select at least " + siteMin + " sites.</li>";
	} else if(activeSites > siteMax) {
		active = false;
		body = body + "<li>Too many sites selected. Please select no more than " + siteMax + " sites.</li>";
	}
    
  return {active: active, body: body};
  
}

netAssess.errorChecking.areaServed = function(event) {

  var bc = netAssess.errorChecking.basics(300, 1);
  
  if(bc.active) {
    netAssess.loading.show();
    netAssess.floaters.areaServed.close();
    netAssess.floaters.popup.close();
    netAssess.map.addLayer(netAssess.layerGroups.areaServed)
  } else {
    event.stopImmediatePropagation();
  	bc.body = bc.body + "</ul>";
  	netAssess.showAlert("Area Served Error", bc.body)
  }
  
}

netAssess.errorChecking.rembias = function(event) {
  var bc = netAssess.errorChecking.basics(100, 1);
  var param = $("#paramOfInterest").select2("val");
  var vp = ["44201", "88101", "88502"];
  if(vp.indexOf(param) == -1) {
    bc.active = false;
    bc.body = bc.body + "<li>Removal Bias estimates are only available for parameter codes 44201, 88101, and 88502.</li>"
  }
  
  if(bc.active) {
    netAssess.loading.show();
    netAssess.layerGroups.rembias.addTo(netAssess.map);
  } else {
    event.stopImmediatePropagation();
  	bc.body = bc.body + "</ul>";
  	netAssess.showAlert("Removal Bias Error", bc.body)
  }
  
}

netAssess.errorChecking.cormat = function(event) {

  var bc = netAssess.errorChecking.basics(25, 2);
  var param = $("#paramOfInterest").select2("val");
  var vp = ["44201", "88101", "88502"];
  if(vp.indexOf(param) == -1) {
    bc.active = false;
    bc.body = bc.body + "<li>Correlation matrices are only available for parameter codes 44201, 88101, and 88502.</li>"
  }
  
  if(bc.active) {
    netAssess.loading.show();
    netAssess.floaters.cormat.open()
  } else {
    event.stopImmediatePropagation();
    bc.body = bc.body + "</ul>";
    netAssess.showAlert("Correlation Matrix Error", bc.body);
  }

}

netAssess.showAlert = function(heading, body) {
  $("#alert-heading").html(heading);
	$("#alert-body").html(body);
	$("#alert").addClass("alert-open");

}

$("#areaSelectZoomButton, #aoiZoomButton").on("click", function() {
	netAssess.map.fitBounds(netAssess.layerGroups.aoi.getBounds());
})


$("#alert-close").on("click", function() {$("#alert").removeClass("alert-open")})

netAssess.layerGroups.sites.on("visibilityupdate", function(event) {
  document.getElementById("visibleSites").updateAnchor(event.keys);
})
netAssess.layerGroups.sites.on("selectionupdate", function(event) {
  document.getElementById("selectedSites").updateAnchor(event.keys);
})
netAssess.layerGroups.newSites.on("visibilityupdate", function(event) {
  document.getElementById("visibleNewSites").updateAnchor(event.keys);
})
netAssess.layerGroups.newSites.on("selectionupdate", function(event) {
  document.getElementById("selectedNewSites").updateAnchor(event.keys);
})

netAssess.layerGroups.sites.on("selectionupdate visibilityupdate", function(event) {
  if(netAssess.layerGroups.sites.options.selectedSites.length > 0) {
    $("#sitesDataDownload").parents("tr").removeClass("disabled");
    if(['44201', '88101', '88502'].indexOf($("#paramOfInterest").select2("val")) != -1) {
      $("#correlationDataDownload").parents("tr").removeClass("disabled");
      $("#rembiasDataDownload").parents("tr").removeClass("disabled");
    } else {
      $("#correlationDataDownload").parents("tr").addClass("disabled");
      $("#rembiasDataDownload").parents("tr").addClass("disabled");
    }
  } else {
    $("#sitesDataDownload").parents("tr").addClass("disabled");
    $("#correlationDataDownload").parents("tr").addClass("disabled");
    $("#rembiasDataDownload").parents("tr").addClass("disabled");
  }
})

netAssess.layerGroups.areaServed.on("layeradd", function() {
  $("#areaServedDataDownload").parents("tr").removeClass("disabled");
})

netAssess.layerGroups.areaServed.on("layerremove", function() {
  $("#areaServedDataDownload").parents("tr").addClass("disabled");
})

netAssess.map.on("popupopen", function(e) {
  if(e.popup._source.hasOwnProperty("properties")) {
    var key = e.popup._source.properties.key;
    document.getElementById("popupID").updateAnchor(key);
    $(".popup-trend").on("click", function(event) {
      $("#bigChart").attr("src", $(this).find("img").attr("src"))
      netAssess.floaters.popup.open();
    })
  }
})


/* Scripts to setup and handle the Sidebars */

netAssess.sidebars = {
  settings: L.control.sidebar('settings-sb', {position: 'right', autoPan: false}),
  help: L.control.sidebar('help-sb', {position: 'right', autoPan: false}),
  about: L.control.sidebar("about-sb", {position: 'right', autoPan: false})
}

L.easyButton("fa-cogs", function() {netAssess.toggleSidebars("settings");}, "Settings", netAssess.map);
L.easyButton("fa-question", function() {netAssess.toggleSidebars("help");}, "Help", netAssess.map);
L.easyButton("fa-info", function() {netAssess.toggleSidebars("about");}, "About", netAssess.map);

// Add the sidebars to the map
for(var sb in netAssess.sidebars) {
  if(netAssess.sidebars.hasOwnProperty(sb)) {
		netAssess.map.addControl(netAssess.sidebars[sb]);
	}
};

netAssess.toggleSidebars = function(sb) {
  var sidebars = netAssess.sidebars;
  for(var x in sidebars) {
    if(sidebars.hasOwnProperty(x)) {
      if(x == sb) {
        sidebars[x].toggle();
      } else {
        sidebars[x].hide();
      }
    }
  }
}

$("#ozoneNAAQS").on("change", function(e) {
  switch(e.target.value) {
    case "65ppb":
      var o3_overlay = "images/o3_65.png";
      break;
    case "70ppb":
      var o3_overlay = "images/o3_70.png";
      break;
    default:
      var o3_overlay = "images/o3_75.png";
  }
  if($("#expParam").val() == "44201") {
    $("#areaServedThreshold").html("(" + $("#ozoneNAAQS").val() + ")");
  }
  netAssess.overlays.o3.setUrl(o3_overlay);
  
})

netAssess.map.on("overlayadd", function(e) {
  if(e.name == "Ozone Probability" || e.name == "PM<sub>2.5</sub> Probability") {
    e.layer.bringToBack();
    $("#probLegend").css("display", "table-row");
    netAssess.floaters.legend.checkBottom();
  } else if(e.name == "Removal Bias") {
    $("#biasLegend").css("display", "table-row");
    netAssess.floaters.legend.checkBottom();
  } else if(e.name == "Correlations") {
    $("#corLegend").css("display", "table-row");
    netAssess.floaters.legend.checkBottom();
  } else {
    e.layer.bringToBack();
  }
})

netAssess.map.on("overlayremove", function(e) {
  if(e.name == "Ozone Probability" || e.name == "PM<sub>2.5</sub> Probability") {
    $("#probLegend").css("display", "none");
  } else if(e.name == "Removal Bias") {
    $("#biasLegend").css("display", "none");
  } else if(e.name == "Correlations") {
    $("#corLegend").css("display", "none");    
  }
})

netAssess.layerGroups.sites.on("correlate", function(event) {
  document.getElementById("cormapSite").updateAnchor(event.site.properties.key);
  netAssess.layerGroups.cormap.addTo(netAssess.map);
})

netAssess.layerGroups.sites.on("decorrelate", function(event) {
  document.getElementById("cormapSite").updateAnchor(null);
  netAssess.layerGroups.cormap.clearLayers();
  netAssess.map.removeLayer(netAssess.layerGroups.cormap);
})

netAssess.updateCorLayer = function(data) {
  var layer = netAssess.layerGroups.cormap,
  style = {radius: 8, stroke: true, weight: 1, opacity: 1, color: "#000", fill: true, fillOpacity: 1},
  param = $("#paramOfInterest").select2("val");
  layer.clearLayers();
  
  var min = Math.min.apply(Math, data.cor);
  var max = Math.max.apply(Math, data.cor);
  
  max = Math.max(Math.abs(min), Math.abs(max));
  
  function colorCalc(cor) {
    var col;
    if(cor > 0.95) {
      col = "#E41A1C";
    } else if(cor > 0.9) {
      col = "#FF7F00";
    } else if(cor > 0.8) {
      col = "#FFFF33";
    } else if(cor > 0.7) {
      col = "#4DAF4A";
    } else if(cor > 0.6) {
      col = "#377EB8";
    } else {
      col = "#984EA3";
    }
    return col;
  }
  
  netAssess.layerGroups.sites.eachLayer(function(site) {
    
    if(site.keyCheck(data.site)) {
      
      for(var i = 0; i < site.properties.key.length; i++) {
        var n = data.site.indexOf(site.properties.key[i])
        if(n != -1) {
          break;
        }
      }
      
      style.fillColor = colorCalc(data.cor[n])
      
      var mark = L.circleMarker(site._latlng, style), po, id = ""

      for(var i = 0; i < site.properties.site_id.length; i++) {
        id = id + site.properties.site_id[i] + "<br />"
      }
                
      po = "<span class = 'popup-text'><h4 class = 'header'>Correlation Information</h4>"
      po = po + "<center><table class = 'popup-table bias'>"
      po = po + "<tr><td>Site ID</td><td>" + id + "</td></tr>"
      po = po + "<tr><td>Pearson Correlation</td><td>" + data.cor[n] + "</td></tr>"
      po = po + "<tr><td>Relative Difference</td><td>" + data.dif[n] + "</td></tr>"
      po = po + "<tr><td>Distance</td><td>" + data.dis[n] + " km</td></tr>"
      po = po + "</table></span>"
      
      mark.bindPopup(po, {minWidth: 150})
      
      layer.addLayer(mark)
      
    }
  })
  
  netAssess.loading.hide();  
}

netAssess.updateBiasLayer = function(data) {
  
  var layer = netAssess.layerGroups.rembias, 
  style = {radius: 8, stroke: true, weight: 1, opacity: 1, color: "#000", fill: true, fillOpacity: 1}, 
  param = $("#paramOfInterest").select2("val");
  if(param == "44201") {
    unit = "ppm"
  } else {
    unit = "&mu;g/m<sup>3</sup>"
  }
  layer.clearLayers()
    
  var min = Math.min.apply(Math, data.data.bias_mean)
  var max = Math.max.apply(Math, data.data.bias_mean)
  
  max = Math.max(Math.abs(min), Math.abs(max));  
  
  function colorCalc(bias) {
    var b = Math.abs(bias);
    var col = "#FFF";
    
    var c = 256 - parseInt(b/max*256, 10);
    c = c.toString(16);
    if(c.length == 1) {c = "0" + c}
    
    if(bias < 0) {
      col = "#" + c + c + "FF";
    } else if(bias > 0) {
      col = "#FF" + c + c;
    }
    
    return col
    
  }
  
  netAssess.layerGroups.sites.eachLayer(function(site) {
    
    if(site.keyCheck(data.data.Key)) {
      
      for(var i = 0; i < site.properties.key.length; i++) {
        var n = data.data.Key.indexOf(site.properties.key[i])
        if(n != -1) {
          break;
        }
      }
      
      style.fillColor = colorCalc(data.data.bias_mean[n])
      
      var mark = L.circleMarker(site._latlng, style), po, id = ""

      for(var i = 0; i < site.properties.site_id.length; i++) {
        id = id + site.properties.site_id[i] + "<br />"
      }
      
      var start_date = String(data.data.start_date[n]);
      var end_date = String(data.data.end_date[n]);
      
      start_date = start_date.substring(0,4) + "-" + start_date.substring(4,6) + "-" + start_date.substring(6,8);
      end_date = end_date.substring(0,4) + "-" + end_date.substring(4,6) + "-" + end_date.substring(6,8);
            
      po = "<span class = 'popup-text'><h4 class = 'header'>Removal Bias Information</h4>"
      po = po + "<center><table class = 'popup-table bias'>"
      po = po + "<tr><td>Site ID</td><td>" + id + "</td></tr>"
      po = po + "<tr><td>Minimum Bias</td><td>" + data.data.bias_min[n] + unit + "</td></tr>"
      po = po + "<tr><td>Maximum Bias</td><td>" + data.data.bias_max[n] + unit + "</td></tr>"
      po = po + "<tr><td>Mean Bias</td><td>" + data.data.bias_mean[n] + unit + "</td></tr>"
      po = po + "<tr><td>Start Date</td><td>" + start_date + "</td></tr>"
      po = po + "<tr><td>End Date</td><td>" + end_date + "</td></tr>"
      po = po + "<tr><td>Neighbors Included</td><td>" + data.data.bias_n[n] + "</tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; padding-top: 8px; border-right: none;'>Relative Removal Bias</td></tr>"
      po = po + "<tr><td>Min Relative Bias</td><td>" + data.data.relbias_min[n] + "%</td></tr>"
      po = po + "<tr><td>Max Relative Bias</td><td>" + data.data.relbias_max[n] + "%</td></tr>"
      po = po + "<tr><td>Mean Relative Bias</td><td>" + data.data.relbias_mean[n] + "%</td></tr>"

      po = po + "</table></span>"
      
      mark.bindPopup(po, {minWidth: 150})
      
      layer.addLayer(mark)
      
    }
  })
  
  netAssess.loading.hide();
  
}

$("#resetAppButton").on("click", function() {
  
  var r = confirm("Are you sure you want to reset the app?")
  
  if(r == true) {
    
    netAssess.resetApp();
    
  }
  
})

netAssess.resetApp = function() {
  
  // Reset Parameter Of Interest
  $("#paramOfInterest").select2("val", -1);
  $("#paramOfInterest").trigger("change");
  
  // Reset Area of Interest
  $("#areaSelect0").click();    
  
  // Clear all Tool Layers
  netAssess.layerGroups.aoi.clearLayers();
  netAssess.layerGroups.areaServed.clearLayers();
  netAssess.layerGroups.rembias.clearLayers();
  netAssess.layerGroups.cormap.clearLayers();
  
  // Reset visible layers
  netAssess.map.removeLayer(netAssess.overlays.o3);
  netAssess.map.removeLayer(netAssess.overlays.pm25);
  netAssess.map.removeLayer(netAssess.layerGroups.rembias);
  netAssess.map.removeLayer(netAssess.layerGroups.cormap);
  netAssess.map.removeLayer(netAssess.layerGroups.aoi);
  netAssess.map.addLayer(netAssess.layerGroups.areaServed);
  
  // Close all Floaters except the legend
  $("#alert").removeClass("alert-open")
  var k = Object.keys(netAssess.floaters);
  for(var i = 0; i < k.length; i++) {
    if(k[i] != "legend") netAssess.floaters[k[i]].close()
  }
  
  // Unselect all sites
  netAssess.layerGroups.sites.eachLayer(function(site) {
    
    site.deselect();
    
  })
  
  // Clear all New Sites
  netAssess.layerGroups.newSites.clearLayers();
  
  // Reset Settings
  $("#ozoneNAAQS").val("75ppb");
  $("#areaServedClipping").val("border");
  $("#areaServedType").val("voronoi");
  $("#pmType").val("both");
  
  // Zoom to continental US
  netAssess.zoomOut() 
  
}



netAssess.ee = function() {
  var esri_img = $("div.esri-leaflet-logo img").attr("src");
  $("div.esri-leaflet-logo img")
    .on("mouseover", function() {
      $(this).attr("src", "images/pbe.png")
    })
    .on("mouseout", function() {
      $(this).attr("src", esri_img);
    })
}
netAssess.map.on("baselayerchange", netAssess.ee)
netAssess.ee()








$("#areaSelect0").click();
netAssess.floaters.legend.open();