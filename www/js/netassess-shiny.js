Shiny.addCustomMessageHandler("addOverlay", 
  function(data) {
    if(data.type == "points") {
      var x = 5
    }
    
  }
);

Shiny.addCustomMessageHandler("displayArea",
  function(data) {
	if(data.coords.length == 1) {
		var x = L.polygon(data.coords[0]);
	} else if(data.coords.length > 1) {
		var x = L.multiPolygon(data.coords);
	}
	aoi.clearLayers();
	aoi.addLayer(x);
	
	o3mon.eachLayer(checkAttributes, data.properties);
	pm25mon.eachLayer(checkAttributes, data.properties);
	
  }
);

function checkAttributes(layer) {

	if(layer.feature.properties[this.type + "_CODE"] == this.id) {
		$(layer._icon).addClass("selected");
		layer.feature.properties.selected = true;
	} else {
		$(layer._icon).removeClass("selected");
		layer.feature.properties.selected = false;
	}

}