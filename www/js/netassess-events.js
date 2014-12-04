	// Ensures that if the window is resized, the map will resize with it
	$(window).resize(function() {
		netAssess.resizeMap();
	})

	// Menubar buttons
	$("#full_extent").on("click", netAssess.mapControls.fullExtent);
	$("#aoi_button").on("click", netAssess.floaters.aoi.open);
	$("#cormatButton").on("click", netAssess.checkCorMat);
	$("#resetApp").on("click", netAssess.reset)
	$("#areaSelectZoom, #aoiZoom").on("click", function() {
		netAssess.map.fitBounds(netAssess.layerGroups.aoi.getBounds())
	})
	$("#areaServedCalcButton").on("click", netAssess.checkAreaServed);
	$("#expParam").on("change", netAssess.loading.show)

	netAssess.map.on('draw:created', function(e) {
		if(e.layerType != "marker") {
			netAssess.floaters.aoi.open();
			netAssess.setAOI(e)
			netAssess.resetPredefinedAreaSelect()
		} else {
			netAssess.populateNewSiteData(e);
		}
	})

	$("#draw_polygon").on('click', function() {
		netAssess.disableDrawing();
		netAssess.floaters.aoi.minimize();
		netAssess.draw.polygon.enable()
	});
	  
	$("#draw_rectangle").on('click', function() {
		netAssess.disableDrawing();
		netAssess.floaters.aoi.minimize();
		netAssess.draw.rectangle.enable()
	});
  
	$("#cancel_draw").on('click', netAssess.disableDrawing);
  
	$("#alert-close").on('click', function(e) {
		$("#alert").removeClass("alert-open")
	})

	$("#new_site_button").on('click', function(e) {
		netAssess.layerGroups.newSiteSelection.clearLayers()
		netAssess.draw.new_site.enable();
	})

	$("#new_site_add").on('click', function(e) {
		netAssess.addNewSite();
	})

	$("#bookmarks").on("click", function() {
		$("#downloadData")[0].click();
	});

	$("#removebias").on("click", notImp);
  
	$("#curtain").removeClass("loading");
  
	// Helps ensure that the layer remain in a more logical order (z-index) 
	// when the user adds/removes them with the layer control
	netAssess.map.on("overlayadd", function(event) {
		if(event.name == "Ozone Exceedence Probability") {
			event.layer.bringToBack();
		} else if(event.name == "PM<sub>2.5</sub> Exceedence Probability") {
			event.layer.bringToBack();
		} else if(event.name == "AreaServed") {
			event.layer.bringToFront();
		} else if(event.name == "Area of Interest") {
			netAssess.layerGroups.areaServed.bringToFront();
		}
	})