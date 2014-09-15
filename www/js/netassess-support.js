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

	aoi.clearLayers();
	aoi.addLayer(e.layer);
	
	aoi.on("click", function(e) {
		map.fitBounds(e.layer.getBounds());
	})
	
	if(e.layerType == "polygon") {
		o3mon.eachLayer(checkPolygon, e.layer);
		pm25mon.eachLayer(checkPolygon, e.layer);
	} else if(e.layerType == "rectangle") {
		alert("rectangle")
	} else if(e.layerType == "circle") {
		alert("circle")
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

$("#areaSelectSelect").on("change", function(e) {
	var type = $("#areaSelect input[checked='checked']").attr("value");
	var code = this.value;
	displayGeometry(type, code);
})

function displayGeometry(type, code) {

	if(type == "State") {
		var url = "http://tigerweb.geo.census.gov/arcgis/rest/services/State_County/MapServer/14/"
		var w = "STATE=" + code;
	}
	aoi.clearLayers();
	var gj = L.esri.featureLayer(url, {where: w}).addTo(aoi);

}

// Functions for styling map elements
var o3Icon = L.divIcon({className: 'map-icon o3-icon'});
var pmIcon = L.divIcon({className: 'map-icon pm-icon'});

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

function resetHighlight(e) {
	o3served.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight
	});
}

