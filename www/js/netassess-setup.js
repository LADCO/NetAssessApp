	// Temporary function for non-implemented buttons/placeholders
	function notImp() {
		alert("This feature is not yet implemented.")
	}

// Create the global netAssess Object
var netAssess = {
	data: {
		newSiteCounter: 90001,
		us_bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]),
		us_center: L.latLng([39.8333, -98.5833]),
	},
	loading: {
		show: function() {
			$("div.loading").removeClass("hidden");
		},
		hide: function() {
			$("div.loading").addClass("hidden");
		}
	},
	icons: {
		existingSite: L.divIcon({className: 'site-icon hidden'}),
		newSite: L.divIcon({className: 'new-site-icon'}),
		siteSelector: L.divIcon({className: 'fa fa-crosshairs new-site-selector'})
	},
	basemaps: {
		"Gray": L.layerGroup([L.esri.basemapLayer("Gray"), L.esri.basemapLayer("GrayLabels")]),
		"Street": L.esri.basemapLayer("Streets"),
		"Satellite" : L.esri.basemapLayer("Imagery"),
		"Satellite - Labelled": L.layerGroup([L.esri.basemapLayer("Imagery"), L.esri.basemapLayer("ImageryLabels")])
	},
	overlays: {
		o3: L.imageOverlay("images/o3_75.png", [[24.51748, -124.76255], [49.38436, -66.92599]], {opacity: 0.65}),
		pm25: L.imageOverlay("images/pm25_35.png", [[24.51748, -124.76255], [49.38436, -66.92599]], {opacity: 0.65})
	},
	controls: {
		sidebars: {
			settings: L.control.sidebar('settings-sb', {position: 'right', autoPan: false}),
			help:  L.control.sidebar('help-sb', {position: 'right', autoPan: false}),
			about: L.control.sidebar('about-sb', {position: 'right', autoPan: false})
		}
	},
	floaters: {
		cormat: new $.floater("#cormat", {title: "Correlation Matrix", width: "800px", height: "640px;", top: "80px", resize: true, left: "80px"}),
		areaServed: new $.floater("#areainfo", {title: "Area Served Information", top: "50px", right: "50px"}),
		aoi: new $.floater("#aoi", {title: "Area of Interest"}),
		legend: new $.floater("#legend", {title: "Legend", close: false, width: '400px', height: "250px", right: "50px", bottom: "50px"}),
		newSite: new $.floater("#new_site", {title: "Add New Site", width: '400px', close: false, minimize: false}),
    popup: new $.floater("#popup", {title: "Popup", width: "600px", left: "200px", minimize: false})
  },
	resizeMap: function() {
		document.getElementById("map").style.width = window.innerWidth + "px";
		document.getElementById("map").style.height = (window.innerHeight - 40) + "px";
	}
};

netAssess.resizeMap();

netAssess.layerGroups = {
	newSiteSelection: L.layerGroup(),
	areaServed: L.featureGroup(null),
	aoi: L.featureGroup(),
	sites: L.geoJson(null, {
		pointToLayer: function(feature, latlon) {
			var mark = new L.marker(latlon, {contextmenu: true, icon: netAssess.icons.existingSite});
			mark.options.contextmenuItems = [
				{text: "Toggle Selected", index: 0, callback: netAssess.toggleSelected, context: mark},
				{text: "Hide Monitor", index: 1, callback: netAssess.hideMonitor, context: mark},
				{separator: true, index: 2}
			];
			return mark;
		},
		onEachFeature: function(feature, layer) {
 
      po = "<span class = 'popup-text'><h4 class = 'header'>Site Information</h4>"
      po = po + "<center><table class = 'popup-table'><tr>"
      
    	po = po + "<td>Site ID(s)</td><td>"
    	for(si in feature.properties.site_id) {
    	  po = po + feature.properties.site_id[si] + "<br />"
    	}
      po = po + "</td></tr>"
      
      po = po + "<tr><td>Street Address</td>"
    	po = po + "<td>" + feature.properties.Street_Address + "</td></tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; padding-top: 5px; border-right: none;'>Parameter Counts</td></tr>"
      po = po + "<tr><td>Total</td><td>" + feature.properties.Count + "</td></tr>"
    	po = po + "<tr><td>Criteria:</td><td>" + feature.properties.Crit_Count + "</td></tr>"
    	po = po + "<tr><td>HAPS:</td><td>" + feature.properties.HAP_Count + "</td></tr>"
    	po = po + "<tr><td>Met:</td><td>" + feature.properties.Met_Count + "</td></tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; padding-top: 5px; border-right: none;'>Design Value Trends</td></tr>"
      po = po + "<tr><td colspan = 2 style = 'text-align: center; border-right: none;'><div class = 'popup-trend'><img /></div></center></td></tr>"
      po = po + "</table>"
    	po = po + "</span>"
    
    	layer.bindPopup(po, {minWidth: 150});
    	layer.on("click", function(el) {
    		$("#monitorSelect").data("monitor", this.feature.properties.key)
    		$("#map").trigger("monitorSelect")
    	})
      
    }
	}),
	newSites: L.geoJson(null, {
		pointToLayer: function(feature, latlon) {
			var mark = new L.marker(latlon, {contextmenu: true, icon: netAssess.icons.newSite});
			mark.options.contextmenuItems = [
				{text: "Toggle Selected", index: 0, callback: netAssess.toggleSelected, context: mark},
				{text: "Delete Monitor", index: 1, callback: netAssess.hideMonitor, context: mark},
				{separator: true, index: 2}
			];
			return mark;
		},
		onEachFeature: function(feature, layer) {

      po = "<span class = 'popup-text'><h4 class = 'header'>New Site Information</h4>"
      po = po + "<center><table class = 'popup-table'><tr>"
      
      po = po + "<td>Site ID</td><td>" + feature.properties.Name + "</td></tr>"
      po = po + "<tr><td>County</td><td>" + feature.properties.County + "</td></tr>"
      po = po + "<tr><td>State</td><td>" + feature.properties.State + "</td></tr>"

      po = po + "<tr><td>Parameters</td><td>"
      for(var i = 0; i < feature.properties.Params.length; i++) {
        po = po + feature.properties.Params[i] + "<br />"
      }
      po = po + "</td></tr>"

      po = po + "</table></span>"
  
    	layer.bindPopup(po, {minWidth: 150});

    }
	})
}

netAssess.mapControls = {
	fullExtent: function() {
		netAssess.map.fitBounds(netAssess.data.us_bounds);
	}
}

// Create the map
netAssess.map = L.map('map', {
	contextmenu: false, 
	contextmenuWidth: 140, 
	contextmenuItems: [
		{text: "Full Extent", iconCls: "fa fa-search-minus", callback: netAssess.mapControls.fullExtent},
		{text: "Area of Interest", iconCls: "fa fa-crosshairs", callback: netAssess.floaters.aoi.open}
	],
	drawControl: false, 
	zoomControl: false,
	maxZoom: 12, 
	minZoom: 3
}).fitBounds(L.latLngBounds([24.4, -124.8], [49.4, -66.9]));
  
netAssess.draw = {
	polygon: new L.Draw.Polygon(netAssess.map, {allowInterSection: false, showArea: false, drawError: {color: '#b00b00', timeout: 1000}, shapeOptions: {color: '#0033ff'}}),
	rectangle: new L.Draw.Rectangle(netAssess.map, {shapeOptions: {color: '#0033ff'}}),
	new_site: new L.Draw.Marker(netAssess.map, {icon: netAssess.icons.siteSelector})
}

// Tests visible monitoring locations to see if they fall with the defined
// area of interests. Sets properties accordingly and then updates sites layer
netAssess.setAOI = function(e) {  

	// Hack to handle both polygon and multipolygon layers
	if(e.hasOwnProperty("layer")) {
		var l = e.layer;
		var t = e.layerType;
	} else {
		var l = e;
		var t = "polygon";
	}

	netAssess.layerGroups.areaServed.clearLayers();
	netAssess.layerGroups.aoi.clearLayers();
	netAssess.layerGroups.aoi.addLayer(l);

	netAssess.layerGroups.aoi.on("click", function(l) {
		netAssess.map.fitBounds(l.layer.getBounds());
	})

	if(t == "polygon" || t == "rectangle") {
		netAssess.layerGroups.sites.eachLayer(netAssess.checkPolygon, l);
		netAssess.layerGroups.newSites.eachLayer(netAssess.checkPolygon, l);
	} else {
		alert("Unknown Input to checkAOI function")
	}

	netAssess.displaySites();

	var aoiPolygons = {};

	netAssess.layerGroups.aoi.eachLayer(function(layer) {
		var ll = layer.getLatLngs();
		aoiPolygons[layer._leaflet_id] = ll;
	})

	$("#areaOfInterest").data("aoi", aoiPolygons);

	$("#map")
		.trigger("siteSelection")
		.trigger("aoiChange")
		.trigger("newSiteUpdate");

}

netAssess.checkPolygon = function(x) {

	var inside = false;

	if(this.hasOwnProperty("_layers")) {
		this.eachLayer(function(layer) {
			if(netAssess.pip(x._latlng, layer)) {inside = true}
		})
	} else {
		inside = netAssess.pip(x._latlng, this);
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
netAssess.pip = function(point, polygon) {

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
netAssess.setPredefinedArea = function(data) {

	if(data.coords.length == 1) {
		var x = L.polygon(data.coords[0]);
	} else if(data.coords.length > 1) {
		var x = L.multiPolygon(data.coords);
	}

	netAssess.disableDrawing();
	netAssess.setAOI(x);

}

// Function called by a shiny custom message handler when the selected
// parameter changes. Takes a list of monitor ids from the server and changes 
// their visible status to true, sets all sites layers to visible properties
// to false.
netAssess.updateVisibleMonitors = function(data) {

	var sites = netAssess.layerGroups.sites;
	var newSites = netAssess.layerGroups.newSites;
	
	if(!$.isArray(data)) {
		data = [data];
	}
	
	for(var key in sites._layers) {
	  if(sites._layers.hasOwnProperty(key)) {
		var el = sites._layers[key].feature;
		var inc = false;
		for(var i = 0; i < el.properties.key.length; i++) {
			var val = el.properties.key[i]
			if(data.indexOf(val) != -1) {inc = true;}
		}
		el.properties.visible = inc;
	  }
	}
	
	newSites.eachLayer(function(layer) {
		layer.feature.properties.visible = layer.feature.properties.Params.indexOf($("#expParam").val()) != -1;
	})
	
	netAssess.layerGroups.areaServed.clearLayers()
	netAssess.displaySites();

	$("#map")
		.trigger("siteSelection")
		.trigger("newSiteUpdate")
		.trigger("siteUpdate");

	netAssess.loading.hide();

  }


  // Cycles through the sites layer updating the sites based on their 'visible'
  // and 'selected' properties
netAssess.displaySites = function() {

	netAssess.layerGroups.sites.eachLayer(netAssess.siteCheck);
	netAssess.layerGroups.newSites.eachLayer(netAssess.siteCheck);
  
}
  
netAssess.siteCheck = function(layer) {

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
// netAssess.initializeNewSite = 
    
/* Call by a shiny custom message handler. Displays provided area served data */  
netAssess.updateAreaServed = function(data) {

	var areaServed = netAssess.layerGroups.areaServed;

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
        var $param = $("#expParam").val();
        var $thresh = $("#areaServedThreshold");
        if($param == "44201") {
          $thresh.html("(" + $("#ozoneNAAQS").val() + ")");
        } else if(["88101", "88502"].indexOf($param) != -1) {
          $thresh.html("(35&mu;g/m<sup>3</sup>)");
        } else {
          $thresh.html("");
        }
        netAssess.floaters.areaServed.open();
				$("#map").trigger("areaClick")
			})
	}
  
	netAssess.loading.hide();

}

/* Miscellaneous Functions */

// Function that resets the predefined area. Used mainly on page reload to 
// prevent the predefined area displaying by default.
netAssess.resetPredefinedAreaSelect = function() {
	$('input[name=areaSelect]').attr('checked', false);
	document.getElementById('areaSelectSelect').selectedIndex = -1;
}


// Reset the App
netAssess.reset = function() {
	netAssess.loading.show();
	netAssess.resetPredefinedAreaSelect();
	$("#expParam").select2("val", "-1")
	$("#expParam").trigger("change");
	netAssess.layerGroups.aoi.clearLayers();
	netAssess.layerGroups.areaServed.clearLayers();
	netAssess.floaters.aoi.close();
	netAssess.floaters.areaServed.close();
	netAssess.floaters.cormat.close();
	netAssess.mapControls.fullExtent();
	netAssess.loading.hide();
	$("input[name='areaServedClipping'][value='border']").prop("checked", true);
	$("#areaServedClipping").trigger('change.radioInputBinding');
	netAssess.layerGroups.sites.eachLayer(function(layer) {
		layer.feature.properties.visible = false;
		layer.feature.properties.selected = false;
	});
	netAssess.layerGroups.newSites.clearLayers();
}
  
  // Functions for changing the state of monitoring locations
  
netAssess.toggleSelected = function() {
	this.feature.properties.selected = !this.feature.properties.selected
	$(this._icon).toggleClass("selected", this.feature.properties.selected);
	$("#map")
		.trigger("siteSelection")
		.trigger("newSiteUpdate");
}

netAssess.hideMonitor = function() {
	this.feature.properties.visible = false;
	this.feature.properties.selected = false;
	$(this._icon).addClass("hidden");
	$("#map")
		.trigger("siteSelection")
		.trigger("siteUpdate")
		.trigger("newSiteUpdate");
}

// Toggles the provided sidebar panel, and makes sure all others are closed.
netAssess.toggleSidebars = function(sb) {
	var sidebars = netAssess.controls.sidebars;
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
netAssess.disableDrawing = function() {
	netAssess.draw.polygon.disable();
	netAssess.draw.rectangle.disable();
}

// Function to update and show the alert box
netAssess.showAlert = function(heading, body) {
	$("#alert-heading").html(heading);
	$("#alert-body").html(body);
	$("#alert").addClass("alert-open");
}
  
/* Functions to do error checking on inputs before sending data to shiny server */

netAssess.errorChecking = { 
  basics: function(siteMax, siteMin) {

  	var active = true;
  	var body = "Please correct the following problems:<ul>";
    
  	if($("#expParam").select2("val") == "-1") {
  		active = false;
  		body = body + "<li>No parameter selected</li>"
  	}
    
  	var ss = 0;
    
  	netAssess.layerGroups.sites.eachLayer(function(layer, feature) {
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
  	} else if(ss > siteMax) {
  		active = false;
  		body = body + "<li>Too many monitors selected</li>";
  	}
    
    return {active: active, body: body};
  
  },
  areaServed: function(event) {

  	event.stopPropagation();
  	var bc = netAssess.errorChecking.basics(300, 1);
  
  	if(bc.active) {
  		netAssess.loading.show();
      netAssess.closeFloaters();
  		$("#areaServedCalcButton").trigger(event);
  	} else {
  		bc.body = bc.body + "</ul>";
  		netAssess.showAlert("Area Served Error", bc.body)
  	}
  
  },

  corMat:  function(event) {
    
  	var bc = netAssess.errorChecking.basics(30, 3);
  
  	var param = $("#expParam").select2("val");
  	var vp = ["44201", "88101", "88502"];
  	if(vp.indexOf(param) == -1) {
  		bc.active = false;
  		bc.body = bc.body + "<li>Correlation matrices are only available for parameter codes 44201, 88101, and 88502.</li>"
  	}
    
  	if(bc.active) {
  		netAssess.floaters.cormat.open()
  	} else {
  		bc.body = bc.body + "</ul>";
  		netAssess.showAlert("Correlation Matrix Error", bc.body)
  	}
  	
  },
  checkReport: function(event) {
    var active = true;
    var bc = netAssess.errorChecking.basics(30000, 1); 
  	
    if(!bc.active) {
      active = false;
      bc.body = bc.body + "</ul>";
      netAssess.showAlert("Data Download Error", bc.body)
    } /*else {
      if(Object.keys(netAssess.layerGroups.areaServed._layers).length == 0) {
        bc.body = bc.body + "<li>Area Served must be run before downloading data.</li></ul>"
        netAssess.showAlert("Data Download Error", bc.body)
        active = false;
    	}
    }*/
    
    if(active) {
  		$("#downloadData").trigger(event);
  	}
  }
}



netAssess.populateNewSiteData = function(event) {
  
	event.layer.addTo(netAssess.layerGroups.newSiteSelection);
  
	$("#ns_lat").val(Math.round(event.layer._latlng.lat * 10000) / 10000);
	$("#ns_lng").val(Math.round(event.layer._latlng.lng * 10000) / 10000);
  
	var lat = event.layer._latlng.lat;
	var lng = event.layer._latlng.lng;
	var url = "https://data.fcc.gov/api/block/find?latitude=" + lat + "&longitude=" + lng + "&showall=false&format=jsonp&callback=?"
	$.getJSON(url, function(wd) {
    
		$("#ns_state").val(wd.State.name);
		$("#ns_county").val(wd.County.name);
    $("#ns_census").val(wd.Block.FIPS.substring(0,11));
		netAssess.floaters.newSite.open();

	})

}

netAssess.cancelNewSite = function() {
  netAssess.layerGroups.newSiteSelection.clearLayers();
  netAssess.floaters.newSite.close();
}

netAssess.addNewSite = function() {
	netAssess.layerGroups.newSiteSelection.eachLayer(function(layer) {
		var gj = layer.toGeoJSON();
		var props = {County: $("#ns_county").val(), State: $("#ns_state").val(), 
			Name: $("#ns_name").val(), Params: $("#new_site_parameters").val(),
      Tract: $("#ns_census").val(),	key: netAssess.data.newSiteCounter
		}
		netAssess.data.newSiteCounter++
		props.selected = false;
    if(Object.keys(netAssess.layerGroups.aoi._layers) > 0) {
      netAssess.layerGroups.aoi.eachLayer(function(aoi_layer) {
        if(aoi_layer.hasOwnProperty("_layers")) {
          aoi_layer.eachLayer(function(l) {
            if(netAssess.pip(layer._latlng, l)) {
              props.selected = true;
            }
          })
        } else {
          if(netAssess.pip(layer._latlng, aoi_layer)) {
            props.selected = true;
          }        
        }
      })
    }
		props.visible = props.Params.indexOf($("#expParam").val()) != -1;
		gj.properties = props;
		netAssess.layerGroups.newSites.addData(gj)
		netAssess.layerGroups.newSites.eachLayer(netAssess.siteCheck);
	})
	$("#map").trigger("newSiteUpdate");

	netAssess.layerGroups.newSiteSelection.clearLayers();
	netAssess.floaters.newSite.close();
}

netAssess.closeFloaters = function() {
  netAssess.floaters.areaServed.close();
  netAssess.floaters.popup.close();
  netAssess.floaters.cormat.close();
}