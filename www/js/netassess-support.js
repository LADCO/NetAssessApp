// Set the dimensions of the map div to fill all available space
function resizeMap() {
	document.getElementById("map").style.width = window.innerWidth + "px";
	document.getElementById("map").style.height = (window.innerHeight - 40) + "px";
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

function setAOI(e) {

	
	function checkPolygon(x) {

		if(pip(x._latlng, this)) {
			$(x._icon).addClass("selected");
			x.feature.properties.selected = true;
		} else {
			$(x._icon).removeClass("selected");
			x.feature.properties.selected = false;
		}

	}

  function checkCircle(x) {
  
    if(this._latlng.distanceTo(x._latlng) <= this._mRadius) {
  		$(x._icon).addClass("selected");
			x.feature.properties.selected = true;      
    } else {
  		$(x._icon).removeClass("selected");
			x.feature.properties.selected = false;
    }
  
  }

	aoi.clearLayers();
	aoi.addLayer(e.layer);
	
	aoi.on("click", function(e) {
		map.fitBounds(e.layer.getBounds());
	})
	
	if(e.layerType == "polygon") {
		sites.eachLayer(checkPolygon, e.layer);
		//pm25mon.eachLayer(checkPolygon, e.layer);
	} else if(e.layerType == "rectangle") {
  	sites.eachLayer(checkPolygon, e.layer);
		//pm25mon.eachLayer(checkPolygon, e.layer);
	} else if(e.layerType == "circle") {
    sites.eachLayer(checkCircle, e.layer);
		//pm25mon.eachLayer(checkCircle, e.layer);
	} else {
		alert("Unknown Input")
	}

}



function monitorEach(feature, layer) {
		layer.on("add", function(e) {
			if(this.feature.properties.selected) {
				$(this._icon).addClass("selected");
			}
		})
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

// Functions for styling map elements
var o3Icon = L.divIcon({className: 'map-icon o3-icon'});
var pm25Icon = L.divIcon({className: 'map-icon pm-icon'});

function toggleMarker(a) {
	if(this.feature.properties.selected) {
		this.feature.properties.selected = false;
		$(this._icon).removeClass("selected");
	} else {
		this.feature.properties.selected = true;
		$(this._icon).addClass("selected");
	}
}

function getColor(d) {
	return d > 750 ? "#800026":
		   d > 90 ? "#E31A1C":
		   d > 20 ? "#FD8D3C":
					"#FED976";
};

function style(feature) {
	return {
		fillColor: getColor(feature.properties.POP12_SQMI), 
		weight: 1, 
		color: "#AAA",
		opacity: 1
	}
}

function highlightFeature(e) {
	var layer = e.target;
		layer.setStyle({
		weight: 5,
		color: '#888',
		dashArray: '',
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}
}

// Function to highlight areaServed polygons
function highlightAreaServed(e) {
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
  
}

var areaSelectStyle = {
    fillColor: '#666',
    weight: 2,
    opacity: 0.75,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.4
  }

// Function to unhighlight areaServed polygons
function unhighlightAreaServed(e) {
  e.target.setStyle(areaSelectStyle);
}

function createSitePopup(feature, layer) {
  
  po = "<span class = 'popup-text'><h4 class = 'popup-header'>Site Information</h4>"
  po = po + "<span class = 'popup-subheader'>Site ID(s)</span><br />"
  for(si in feature.properties.site_id) {
    po = po + feature.properties.site_id[si] + "<br />"
  }
  po = po + "<span class = 'popup-subheader'>Parameter Counts</span><br />"
  po = po + "Total: " + feature.properties.Count + "<br />"
  po = po + "Criteria: " + feature.properties.Crit_Count + "<br />"
  po = po + "HAPS: " + feature.properties.HAP_Count + "<br />"
  po = po + "Met: " + feature.properties.Met_Count + "<br />"
  
  
  po = po + "</span>"
  
  layer.bindPopup(po, {minWidth: 150});
  
}
