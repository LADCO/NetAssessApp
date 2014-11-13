  // Call the resizeMap function on page load to set the initial size
  resizeMap();
  
  // Ensures that if the window is resized, the map will resize with it
  $(window).resize(function() {
    resizeMap();
  })
  
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
      callback: aoiFloat.open
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
  
  // Download sites data geojson file
  $.ajax({
    dataType: "json",
    url: "data/sites.geojson",
    success: function(data) {
      // Add visibility and selected status properties
      var site_data = data;
      for(var i = 0; i < site_data.features.length; i++) {
        site_data.features[i].properties.visible = false;
        site_data.features[i].properties.selected = false;
      };
      // Add monitors to the sites layer
      sites.addData(site_data)
      
      L.control.layers(basemaps, 
                       {"Area of Interest": aoi, "Area Served": areaServed}, 
                       {position: 'topleft'}).addTo(map);
  
      loading.hide();
      
    }
  }).error(function(a) {
    alert("sites Error")
  });

/* Add layers to map */

  // Sets the initial basemap to "Gray"
  basemaps["Gray"].addTo(map);
  map.addLayer(sites);
  map.addLayer(aoi);
  areaServed.addTo(map);

/* Initialize map objects */
  
  // Creates the drawing functions for area selection.
  var draw_polygon = new L.Draw.Polygon(map, {allowInterSection: false, showArea: false, drawError: {color: '#b00b00', timeout: 1000}, shapeOptions: {color: '#bada55'}});
  var draw_rectangle = new L.Draw.Rectangle(map, {shapeOptions: {color: '#bada55'}});
  var draw_circle = new L.Draw.Circle(map, {shapeOptions: {color: '#bada55'}});

  // Add the sidebars to the map
  for(var sb in sidebars) {
    if(sidebars.hasOwnProperty(sb)) {
  		map.addControl(sidebars[sb]);
  	}
  };

  // Adds buttons for controlling sidebars
    L.easyButton("fa-cogs", function() {toggleSidebars("settings");}, "Settings");
    L.easyButton("fa-question", function() {toggleSidebars("help");}, "Help");
    L.easyButton("fa-info", function() {toggleSidebars("about");}, "About"); 

/* Set Event Handlers */

  // Menubar buttons
  $("#full_extent").on("click", fullExtent);
  $("#aoi_button").on("click", aoiFloat.open);
  $("#cormatButton").on("click", cormatFloat.open);
  $("#resetApp").on("click", resetApp)
  $("#areaSelectZoom, #aoiZoom").on("click", function() {
    map.fitBounds(aoi.getBounds())
  })
  $("#areaServedCalcButton").on("click", loading.show);
  $("#expParam").on("change", loading.show)
  
  // Drawing events
  map.on('draw:created', function(e) {
    setAOI(e)
    resetPredefinedAreaSelect()
  })
  $("#draw_polygon").on('click', function() {
    disableDrawing();
    draw_polygon.enable()
  });
  $("#draw_rectangle").on('click', function() {
    disableDrawing();
    draw_rectangle.enable()
  });
  $("#draw_circle").on('click', function() {
    disableDrawing();
    draw_circle.enable()
  });
  $("#cancel_draw").on('click', disableDrawing);
  
/* Make sure that everything starts "clean" */
  resetApp();