// Call the resizeMap function on page load to set the initial size
resizeMap();

// Ensures that if the window is resized, the map will resize with it
$(window).resize(function() {
	resizeMap();
})

resetPredefinedAreaSelect()

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

var areaServed = L.featureGroup(null);

var site_data = null;
var sites = null;

$.ajax({
  dataType: "json",
  url: "data/sites.geojson",
  success: function(data) {
    site_data = data;
    for(var i = 0; i < site_data.features.length; i++) {
      site_data.features[i].properties.visible = false;
      site_data.features[i].properties.selected = false;
    };
    sites = L.geoJson(site_data, {
      pointToLayer: function(feature, latlon) {return new L.marker(latlon, {icon: siteIcon});},
      onEachFeature: createSitePopup
    }).addTo(map);
    L.control.layers(basemaps, 
                 null, 
                 {position: 'topleft'})
                .addTo(map);

    loading.hide();
  }
}).error(function(a) {
  alert("sites Error")
});

/*
var sites = L.geoJson(null, {
  pointToLayer: function(feature, latlon) {return new L.marker(latlon, {icon: o3Icon});}
});

var allSites = null;

$.ajax({
  dataType: "json",
  url: "data/sites.geojson",
  success: function(data) {
    allSites = data;
    $("div.loading").addClass("hidden");
  }
}).error(function(a) {
  alert("sites Error")
});
*/
// Adds the control to allow user to select visible layers



















// Creates the drawing functions for area selection and then binds them to the appropriate buttons.
var draw_polygon = new L.Draw.Polygon(map, {allowInterSection: false, showArea: false, drawError: {color: '#b00b00', timeout: 1000}, shapeOptions: {color: '#bada55'}});
var draw_rectangle = new L.Draw.Rectangle(map, {shapeOptions: {color: '#bada55'}});
var draw_circle = new L.Draw.Circle(map, {shapeOptions: {color: '#bada55'}});
$("#draw_polygon").on('click', function() {draw_polygon.enable()});
$("#draw_rectangle").on('click', function() {draw_rectangle.enable()});
$("#draw_circle").on('click', function() {draw_circle.enable()});

var aoi = new L.FeatureGroup();
map.addLayer(aoi);
aoi.clearLayers();

map.on('draw:created', function(e) {
  setAOI(e)
  resetPredefinedAreaSelect()
})

// Adds buttons for controlling tools
L.easyButton("fa-search", function() {toggleSidebars("exp");}, "Network Explorer");
L.easyButton("fa-cogs", function() {toggleSidebars("tools");}, "Tools");
L.easyButton("fa-question", function() {toggleSidebars("help");}, "Help");
L.easyButton("fa-info", function() {toggleSidebars("about");}, "About"); 

// Creates the sidebars
var sidebars = {
  exp:   L.control.sidebar('exp-sb', {position: 'right', autoPan: false}),
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

$('#aoi').drags({handle: "#aoihandle"});
$("#aoi .minimize").on('click', function() {$("#aoi").toggleClass("minimized").toggleClass("open").removeClass("closed")})
$("#aoi .close").on('click', function() {$("#aoi").addClass("closed").removeClass("open").removeClass("minimized")})
$("#ne-open").on("click", function() {$("#aoi").addClass("open").removeClass("closed").removeClass("minimized")})