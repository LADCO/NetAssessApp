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
	drawControl: false, 
	zoomControl: false,
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
  pointToLayer: function(feature, latlon) {return new L.marker(latlon, {icon: o3Icon});},
  onEachFeature: monitorEach
});
var pm25mon = L.geoJson(null, {
  pointToLayer: function(feature, latlon) {return new L.marker(latlon, {icon: pm25Icon});},
  onEachFeature: monitorEach
});
var o3served = L.geoJson();

$.ajax({
  dataType: "json",
  url: "data/areatest.geojson",
  success: function(data) {
    o3served.addData(data);
  }
}).error(function() {alert("o3served Error")});

$.ajax({
  dataType: "json",
  url: "data/pm25mon.geojson",
  success: function(data) {
    pm25mon.addData(data);
  }
}).error(function() {alert("pm25mon Error")});

$.ajax({
  dataType: "json",
  url: "data/o3mon.geojson",
  success: function(data) {
    o3mon.addData(data);
  }
}).error(function() {alert("o3mon Error")});

// Adds the control to allow user to select visible layers
L.control.layers(basemaps, {"O3 Monitors": o3mon, "PM2.5 Monitors": pm25mon}, {position: 'topleft'}).addTo(map);

// Creates the drawing functions for area selection and then binds them to the appropriate buttons.
var draw_polygon = new L.Draw.Polygon(map, {allowInterSection: false, showArea: false, drawError: {color: '#b00b00', timeout: 1000}, shapeOptions: {color: '#bada55'}});
var draw_rectangle = new L.Draw.Rectangle(map, {shapeOptions: {color: '#bada55'}});
var draw_circle = new L.Draw.Circle(map, {shapeOptions: {color: '#bada55'}});
$("#draw_polygon").on('click', function() {draw_polygon.enable()});
$("#draw_rectangle").on('click', function() {draw_rectangle.enable()});
$("#draw_circle").on('click', function() {draw_circle.enable()});

var aoi = new L.FeatureGroup();
map.addLayer(aoi);

map.on('draw:created', setAOI)

// Adds buttons for controlling tools
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