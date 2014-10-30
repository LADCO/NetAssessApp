var mapStateBinding = new Shiny.InputBinding();
$.extend(mapStateBinding, {
  find: function(scope) {
    return $(scope).find("#mapState")
  },
  getValue: function(el) {
    return {bounds: map.getBounds(), zoom: map.getZoom(), center: map.getCenter()};
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
    return {policy: 'debounce', delay: 500};
  },
  unsubscribe: function(el) {
    $(el).off("viewreset");
  }
})
Shiny.inputBindings.register(mapStateBinding);

var selectedSitesBinding = new Shiny.InputBinding()
$.extend(selectedSitesBinding, {
  find: function(scope) {
    return $(scope).find("#selectedSites")
  },
  getValue: function(el) {
    if(sites != null) {
      var selSites = [];
      sites.eachLayer(function(layer) {
          if(layer.feature.properties.selected & layer.feature.properties.visible) {
              selSites.push(layer.feature.properties.key)
          }
      })
      return selSites;
    }
  },
  subscribe: function(el, callback) {
    $("#map").on("siteSelection", callback);
  },
  unsubscribe: function(el) {
    $("#map").off("siteSelection");
  }  
})
Shiny.inputBindings.register(selectedSitesBinding);












var monSelectBinding = new Shiny.InputBinding();
$.extend(monSelectBinding, {
  find: function(scope) {
    return $(scope).find("#monitorSelect")
  },
  getValue: function(el) {
    return $(el).data("monitor");
  },
  setValue: function(el, value) {
    $(el).data("monitor", value)
  },
  subscribe: function(el, callback) {
    $("#map").on("monitorSelect", function(el) {
      callback();
    })
  },
  unsubscribe: function(el) {
    $(el).off("click.netassess")
  }
})
Shiny.inputBindings.register(monSelectBinding);

Shiny.addCustomMessageHandler("addOverlay", 
  function(data) {
    if(data.type == "points") {
      var x = 5
    }
    
  }
);

Shiny.addCustomMessageHandler("displayPredefinedArea",
  function(data) {
  	if(data.coords.length == 1) {
  		var x = L.polygon(data.coords[0]);
  	} else if(data.coords.length > 1) {
  		var x = L.multiPolygon(data.coords);
  	}
    setAOI(x);	
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
        el.properties.visible = inc;
      }
    }
    areaServed.clearLayers()
    displaySites();
    $("#map").trigger("siteSelection");
  }
)

Shiny.addCustomMessageHandler("showAlert",
  function(data) {
  
    alert(data);
  }
)

Shiny.addCustomMessageHandler("showArea", 
  function(data) {
    areaServed.clearLayers()
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

Shiny.addCustomMessageHandler("showLoading", loading.show())
Shiny.addCustomMessageHandler("hideLoading", loading.hide())


function checkAttributes(layer) {

	if(layer.feature.properties[this.type + "_CODE"] == this.id) {
		$(layer._icon).addClass("selected");
		layer.feature.properties.selected = true;
	} else {
		$(layer._icon).removeClass("selected");
		layer.feature.properties.selected = false;
	}

}