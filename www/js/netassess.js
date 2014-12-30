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
		netAssess.layerGroups.sites.addData(site_data)
		
		// Add the layers control
		L.control.layers(netAssess.basemaps, 
						{"Area of Interest": netAssess.layerGroups.aoi, 
						 "Area Served": netAssess.layerGroups.areaServed, 
						 "Ozone Exceedence Probability": netAssess.overlays.o3, 
						 "PM<sub>2.5</sub> Exceedence Probability": netAssess.overlays.pm25
						}, 
						{position: 'topleft'})
		.addTo(netAssess.map);

		// Hide the Loading icon
		netAssess.loading.hide();

	}
}).error(function(a) {
	alert("An error occurred when attempting to load the monitoring location data. If this problem persists, please contact the site administrator listed in the 'About' page.")
});

// Select Boxes
$("#expParam").select2({width: "300px"});
$("#areaSelectSelect").select2({width: "80%"});
$("#new_site_parameters").select2({width: "100%", placeholder: "Click to Select Parameters"});

/* Add layers to map */
 // Sets the initial basemap to "Gray"
netAssess.basemaps["Gray"].addTo(netAssess.map);
netAssess.map.addLayer(netAssess.layerGroups.sites);
netAssess.map.addLayer(netAssess.layerGroups.newSites);
netAssess.map.addLayer(netAssess.layerGroups.newSiteSelection);
netAssess.map.addLayer(netAssess.layerGroups.aoi);
netAssess.layerGroups.areaServed.addTo(netAssess.map);
netAssess.layerGroups.correlations.addTo(netAssess.map);

// Add the sidebars to the map
for(var sb in netAssess.controls.sidebars) {
	if(netAssess.controls.sidebars.hasOwnProperty(sb)) {
		netAssess.map.addControl(netAssess.controls.sidebars[sb]);
	}
};

// Adds buttons for controlling sidebars
L.easyButton("fa-cogs", function() {netAssess.toggleSidebars("settings");}, "Settings", netAssess.map);
L.easyButton("fa-question", function() {netAssess.toggleSidebars("help");}, "Help", netAssess.map);
L.easyButton("fa-info", function() {netAssess.toggleSidebars("about");}, "About", netAssess.map); 

// Adds a scale to the map
L.control.scale().addTo(netAssess.map);
 
/* Make sure that everything starts "clean" */
netAssess.reset();
netAssess.resizeMap();
netAssess.floaters.legend.open();

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