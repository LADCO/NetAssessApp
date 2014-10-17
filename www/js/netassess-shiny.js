var mapBoundsBinding = new Shiny.InputBinding();
$.extend(mapBoundsBinding, {
  find: function(scope) {
    return $(scope).find("#mapBounds")
  },
  getValue: function(el) {
    return {bounds: map.getBounds(), zoom: map.getZoom()};
  },
  setValue: function(el, value) {
    map.fitBounds(value);
  },
  subscribe: function(el, callback) {
    map.on("moveend zoomend", function(e) {
      callback();
    })
  },
  getRatePolicy: function() {
    return {policy: 'debounce', delay: 3000};
  },
  unsubscribe: function(el) {
    $(el).off("viewreset");
  }
})
Shiny.inputBindings.register(mapBoundsBinding);



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

Shiny.addCustomMessageHandler("showMonitors", 
  function(data) {
    if(!$.isArray(data)) {
      data = [data];
    }
    for(var key in sites._layers) {
      if(sites._layers.hasOwnProperty(key)) {
        var el = sites._layers[key].feature;
        var inc = false;
        for(var i = 0; i < el.properties.key.length; i++) {
          var val = el.properties.key[i]
          if(data.indexOf(val) != -1) {
            inc = true;
          }
        }
        $($(sites._layers[key])[0]._icon).toggleClass("hidden", !inc)
      }
    }
/*    var mons = allSites.features.filter(function(el) {
      var inc = false;
      for(var i = 0; i < el.properties.key.length; i++) {
        var val = el.properties.key[i] 
        if(data.indexOf(val) != -1) {
          inc = true;
        }
      }
      return inc;
    })
    sites.clearLayers()
    areaServed.clearLayers()
    sites.addData(mons)  */
  }
)

Shiny.addCustomMessageHandler("showArea", 
  function(data) {
    
    for(var i = 0; i < data.length; i++) {
      if(data[i].length == 1) {
        L.polygon(data[i][0]).addTo(areaServed)
          .setStyle(areaSelectStyle)
          .on("mouseover", highlightAreaServed)
          .on("mouseout", unhighlightAreaServed)
      } else {
        L.multiPolygon([data[i]]).addTo(areaServed)
          .setStyle(areaSelectStyle)
          .on("mouseover", highlightAreaServed)
          .on("mouseout", unhighlightAreaServed)
      }
    }

  }
)




function checkAttributes(layer) {

	if(layer.feature.properties[this.type + "_CODE"] == this.id) {
		$(layer._icon).addClass("selected");
		layer.feature.properties.selected = true;
	} else {
		$(layer._icon).removeClass("selected");
		layer.feature.properties.selected = false;
	}

}