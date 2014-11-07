var windowDimsBinding = new Shiny.InputBinding();
$.extend(windowDimsBinding, {
  find: function(scope) {
    return $(scope).find("#windowDims");
  },
  getValue: function(el) {
    return {height: window.innerHeight, width: window.innerWidth}
  },
  subscribe: function(el, callback) {
    $(window).resize(callback);
  },
  unsubscribe: function(el) {
    $(window).off("resize");
  }
});
Shiny.inputBindings.register(windowDimsBinding);


var visibleSitesBinding = new Shiny.InputBinding();
$.extend(visibleSitesBinding, {
  find: function(scope) {
    return $(scope).find("#visibleSites");
  },
  getValue: function(el) {
    var vs = [];
    sites.eachLayer(function(layer) {
      if(layer.feature.properties.visible) vs.push(layer.feature.properties.key)
    })
    return vs;
  },
  subscribe: function(el, callback) {
    $("#map").on("siteUpdate", callback);
  },
  unsubscribe: function(el) {
    $("#map").off("siteUpdate");
  }
});
Shiny.inputBindings.register(visibleSitesBinding);

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

var clickedAreaServedBinding = new Shiny.InputBinding()
$.extend(clickedAreaServedBinding, {
  find: function(scope) {
    return $(scope).find("#clickedAreaServed");
  },
  getValue: function(el) {
    return $(el).data("clicked");
  },
  subscribe: function(el, callback) {
    $("#map").on("areaClick", callback);
  },
  unsubscribe: function(el) {
    $("#map").off("areaClick");
  }
})
Shiny.inputBindings.register(clickedAreaServedBinding);









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
    $("#map").trigger("siteUpdate");
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
      if(data[i].coords.length == 1) {
        var a = L.polygon(data[i].coords[0], {id: data[i].id}).addTo(areaServed)
      } else {
        var a = L.multiPolygon([data[i].coords], {id: data[i].id}).addTo(areaServed)
      }
      a.setStyle(areaSelectStyle)
          .on("mouseover", highlightAreaServed)
          .on("mouseout", unhighlightAreaServed)
          .on("click", showAreaInfo)
      
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