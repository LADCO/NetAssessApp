// Call the resizeMap function on page load to set the initial size
resizeMap();

// Ensures that if the window is resized, the map will resize with it
$(window).resize(function() {
	resizeMap();
})

resetPredefinedAreaSelect()

$("#expParam").select2({width: "350px"});
$("#areaSelectSelect").select2({width: "80%"});

// Define coordinates of the Continental United States
var us = {bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]), center: L.latLng([39.8333, -98.5833])}

// Create the map object
var map = L.map('map', {
  contextmenu: true,
  contextmenuWidth: 140,
  contextmenuItems: [{
    text: "Full Extent",
    iconCls: "fa fa-search-minus",
    callback: fullExtent
  }, {
    text: "Area of Interest",
    iconCls: "fa fa-crosshairs",
    callback: function() {floatOpen("#aoi")}
  }],
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
    
var areaServed = L.featureGroup(null).addTo(map);

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
      pointToLayer: function(feature, latlon) {
          var mark = new L.marker(latlon, {contextmenu: true, icon: siteIcon});
          mark.options.contextmenuItems = [{text: "Toggle Selected", index: 0, callback: toggleSelected, context: mark},
                                           {text: "Hide Monitor", index: 1, callback: hideMonitor, context: mark},
                                           {separator: true, index: 2}];
          return mark;
      },
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

function floatClose(id) {
  $(id).addClass("closed").removeClass("open").removeClass("minimized");
}
function floatMinimize(id) {
  $(id).toggleClass("minimized").toggleClass("open").removeClass("closed");
}
function floatOpen(id) {
  $(id).addClass("open").removeClass("closed").removeClass("minimized");
}

$('#aoi').drags({handle: "#aoihandle"});
$('#areainfo').drags({handle: "#areainfohandle"});
$("#aoi .minimize").on('click', function() {floatMinimize("#aoi")});
$("#aoi .close").on('click', function() {floatClose("#aoi")});
$("#ne-open").on("click", function() {floatOpen("#aoi")});
$("#areainfo .minimize").on('click', function() {floatMinimize("#areainfo")});
$("#areainfo .close").on("click", function() {floatClose("#areainfo")});

$(".float-panel").on("click", function() {
  $(".float-panel").css("z-index", 50)
  $(this).css("z-index", 100)
})

$("#full_extent").on("click", fullExtent)
$("#aoi_button").on("click", function() {floatOpen("#aoi")})

$("#areaSelectZoom, #aoiZoom").on("click", function() {
  map.fitBounds(aoi.getBounds())
})