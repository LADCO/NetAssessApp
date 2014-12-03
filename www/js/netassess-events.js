	// Ensures that if the window is resized, the map will resize with it
	$(window).resize(function() {
		resizeMap();
	})

	// Menubar buttons
	$("#full_extent").on("click", fullExtent);
	$("#aoi_button").on("click", aoiFloat.open);
	$("#cormatButton").on("click", checkCorMat);
	$("#resetApp").on("click", resetApp)
	$("#areaSelectZoom, #aoiZoom").on("click", function() {
		map.fitBounds(aoi.getBounds())
	})
	$("#areaServedCalcButton").on("click", checkAreaServed);
	$("#expParam").on("change", loading.show)

	map.on('draw:created', function(e) {
		if(e.layerType != "marker") {
			aoiFloat.open();
			setAOI(e)
			resetPredefinedAreaSelect()
		} else {
			populateNewSiteData(e);
		}
	})

	$("#draw_polygon").on('click', function() {
		disableDrawing();
		aoiFloat.minimize();
		draw_polygon.enable()
	});
	  
	$("#draw_rectangle").on('click', function() {
		disableDrawing();
		aoiFloat.minimize();
		draw_rectangle.enable()
	});
  
	$("#cancel_draw").on('click', disableDrawing);
  
	$("#alert-close").on('click', function(e) {
		$("#alert").removeClass("alert-open")
	})

	$("#new_site_button").on('click', function(e) {
		newSiteSelectionLayer.clearLayers()
		draw_new_site.enable();
	})

	$("#new_site_add").on('click', function(e) {
		addNewSite();
	})

	$("#bookmarks").on("click", function() {
		$("#downloadData")[0].click();
	});

	$("#removebias").on("click", notImp);
  
	$("#curtain").removeClass("loading");
  
	// Helps ensure that the layer remain in a more logical order (z-index) 
	// when the user adds/removes them with the layer control
	map.on("overlayadd", function(event) {
		if(event.name == "Ozone Exceedence Probability") {
			event.layer.bringToBack();
		} else if(event.name == "PM<sub>2.5</sub> Exceedence Probability") {
			event.layer.bringToBack();
		} else if(event.name == "AreaServed") {
			event.layer.bringToFront();
		} else if(event.name == "Area of Interest") {
			areaServed.bringToFront();
		}
	})