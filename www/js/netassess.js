// Call the resizeMap function on page load to set the initial size
resizeMap();

// Ensures that if the window is resized, the map will resize with it
$(window).resize(function() {
	resizeMap();
})

// Define coordinates of the Continental United States
var us = {bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]), center: L.latLng([39.8333, -98.5833])}

// Create the map object
var map = L.map('map', {
	contextmenu: true,
	contextmenuWidth: 140,
	contextmenuItems: [{
        text: 'Show coordinates',
        callback: function() {alert("Hello")}
    }, {
        text: 'Center map here',
        callback: function() {alert("This isn't")}
    }, '-', {
        text: 'Zoom in',
        iconCls: 'fa fa-fw fa-context fa-search-plus',
        callback: function() {alert("Working")}
    }, {
        text: 'Zoom out',
        iconCls: 'fa fa-fw fa-context fa-search-minus',
        callback: function() {alert("Yet")}
    }],
	drawControl: false, 
	maxZoom: 12, 
	minZoom: 3
	}).fitBounds(us.bounds);

// Create basemap layers with Esri-Leaflet
var basemaps = {
	"Gray": L.layerGroup([L.esri.basemapLayer("Gray"), L.esri.basemapLayer("GrayLabels")]),
	"Street": L.esri.basemapLayer("Streets"),
	"Satellite" : L.esri.basemapLayer("Imagery"),
	"Satellite - Labelled": L.layerGroup([L.esri.basemapLayer("Imagery"), L.esri.basemapLayer("ImageryLabels")])
	};

// Sets the initial basemap to "Gray"
basemaps["Gray"].addTo(map);


// Add Feature Layers to Map

var o3mon = L.geoJson(null, {
	pointToLayer: function(feature, latlon) {
		return new L.marker(latlon, 
			{contextmenu: true, 
			 contextmenuItems: [{text: 'Toggle Selected', callback: toggleMarker, context: this}], 
			 icon: o3Icon});
		},
	onEachFeature: monitorEach
});

var pm25mon = L.geoJson(null, {
	pointToLayer: function(feature, latlon) {return new L.marker(latlon, {icon: pmIcon});},
	onEachFeature: monitorEach
});

var o3served = L.geoJson();

$.ajax({
  dataType: "json",
	url: "data/areatest.geojson",
	success: function(data) {
		o3served.addData(data);
	}
	}).error(function() {alert("Error")});

$.ajax({
	dataType: "json",
	url: "data/pm25.geojson",
	success: function(data) {
		pm25mon.addData(data);
	}
})
	
$.ajax({
  dataType: "json",
  url: "data/o3mon.geojson",
  success: function(data) {
 	o3mon.addData(data);
  }
})

// Adds the control to allow user to select visible layers
L.control.layers(basemaps, {"O3 Monitors": o3mon, "PM2.5 Monitors": pm25mon}, {position: 'topright'}).addTo(map);

// Add Area of Interest Polygon Drawer
L.drawLocal.draw.toolbar.buttons.polygon = 'Select your area of interest';
var poly = drawControl = new L.Control.Draw({
	position: 'topleft',
	draw: {
		polyline: false,
		polygon: {
			allowIntersection: false,
			showArea: false,
			drawError: {
				color: '#b00b00',
				timeout: 1000
			},
			shapeOptions: {
				color: '#bada55'
			}
		},
		rectangle: false,
		circle: false,
		marker: false
	},
});
map.addControl(poly);

var aoi = new L.FeatureGroup();
map.addLayer(aoi);

map.on('draw:created', setAOI)

// Adds buttons for controlling tools
L.dropdown("fa-circle", function() {alert("Hello")}, "Testing");
L.easyButton("fa-arrows-alt", function() {map.fitBounds(us.bounds)}, "Zoom to Full Extent");
L.easyButton("fa-crosshairs", function() {toggleSidebars("loc");}, "Select Area of Interest");
L.easyButton("fa-cogs", function() {toggleSidebars("tools");}, "Tools");
L.easyButton("fa-question", function() {toggleSidebars("help");}, "Help");
L.easyButton("fa-info", function() {toggleSidebars("about");}, "About"); 

// Creates the sidebars
var sidebars = {
	loc:   L.control.sidebar('loc-sb', {position: 'right', autoPan: false}),
	tools: L.control.sidebar('tools-sb', {position: 'right', autoPan: false}),
	help:  L.control.sidebar('help-sb', {position: 'right', autoPan: false}),
	about: L.control.sidebar('about-sb', {position: 'right', autoPan: false})
}

// Add the sidebars to the map
for(var sb in sidebars) {
	if(sidebars.hasOwnProperty(sb)) {
		map.addControl(sidebars[sb]);
	}
};