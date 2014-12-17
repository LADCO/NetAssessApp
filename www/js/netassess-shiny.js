/* Input Bindings for custom shiny inputs */
netAssess.shinyBindings = {};

netAssess.shinyBindings.popupID = new Shiny.InputBinding();
  $.extend(netAssess.shinyBindings.popupID, {
    find: function(scope) {
      return $(scope).find("#popupID")
    },
    getValue: function(el) {
      return $(el).data("key")
    },
    subscribe: function(el, callback) {
      netAssess.map.on("popupopen", function(e) {
        var key = e.popup._source.feature.properties.key;
        $(el).data("key", key);
        callback();
      })
    }
  })
  Shiny.inputBindings.register(netAssess.shinyBindings.popupID);
  
  // Input that informs shiny about the new monitoring locations that have been 
  // added
netAssess.shinyBindings.newSites = new Shiny.InputBinding();
  $.extend(netAssess.shinyBindings.newSites, {
    find: function(scope) {
      return $(scope).find("#newSites")
    },
    getValue: function(el) {
      if(newSites != null) {
        var new_sites = [];
        netAssess.layerGroups.newSites.eachLayer(function(layer) {
          
          new_sites.push({lat: layer.feature.geometry.coordinates[1],
                          lng: layer.feature.geometry.coordinates[0],
                          name: layer.feature.properties.Name,
                          params: layer.feature.properties.Params,
                          visible: layer.feature.properties.visible,
                          selected: layer.feature.properties.selected,
                          key: layer.feature.properties.key});
                          
        })
        return {data: new_sites};
      }
    },
    subscribe: function(el, callback) {
      $("#map").on("newSiteUpdate", callback);
    },
    unsubscribe: function(el) {
      $("#map").off("newSiteUpdate");
    }
  })
  Shiny.inputBindings.register(netAssess.shinyBindings.newSites);

  // Input that informs shiny about the monitoring locations that have been 
  // selected.
netAssess.shinyBindings.selectedSites = new Shiny.InputBinding()
  $.extend(netAssess.shinyBindings.selectedSites, {
    find: function(scope) {
      return $(scope).find("#selectedSites")
    },
    getValue: function(el) {
      if(netAssess.layerGroups.sites != null) {
        var selSites = [];
        netAssess.layerGroups.sites.eachLayer(function(layer) {
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
  Shiny.inputBindings.register(netAssess.shinyBindings.selectedSites);
  
  // Input that informs shiny about currently visible monitoring locations. This
  // really complicated things but was necessary to allow users to remove a 
  // monitor within an area of interest that they didn't want to affect analysis
netAssess.shinyBindings.visibleSites = new Shiny.InputBinding();
  $.extend(netAssess.shinyBindings.visibleSites, {
    find: function(scope) {
      return $(scope).find("#visibleSites");
    },
    getValue: function(el) {
      var vs = [];
      netAssess.layerGroups.sites.eachLayer(function(layer) {
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
  Shiny.inputBindings.register(netAssess.shinyBindings.visibleSites);
  
  // Input that updates when an area served polygon is clicked. Allows shiny to
  // provide demographic and geographic information about that area, including
  // the age pyramid plot.
netAssess.shinyBindings.clickedAreaServed = new Shiny.InputBinding()
  $.extend(netAssess.shinyBindings.clickedAreaServed, {
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
  Shiny.inputBindings.register(netAssess.shinyBindings.clickedAreaServed);
  
  // Input that updates when a monitoring location is selected. This was used
  // when the demographic/geographic data was handled differently. Still here
  // in case I need it later.
netAssess.shinyBindings.monSelect = new Shiny.InputBinding();
  $.extend(netAssess.shinyBindings.monSelect, {
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
  Shiny.inputBindings.register(netAssess.shinyBindings.monSelect);

// Binding to let shiny know what the currently selected area of interest is. 
// Used for clipping area served polygons.
netAssess.shinyBindings.areaOfInterest = new Shiny.InputBinding();
  $.extend(netAssess.shinyBindings.areaOfInterest, {
    find: function(scope) {
      return $(scope).find("#areaOfInterest")
    },
    getValue: function(el) {
      return $(el).data("aoi")
    },
    subscribe: function(el, callback) {
      $("#map").on("aoiChange", function(el) {
        callback();
      })
    },
    unsubscribe: function(el) {
      $("#map").off("aoiChange");
    }
  })
  Shiny.inputBindings.register(netAssess.shinyBindings.areaOfInterest);

/* Custom Message Handlers */

Shiny.addCustomMessageHandler("displayPredefinedArea", netAssess.setPredefinedArea);

Shiny.addCustomMessageHandler("updateAreaServed", netAssess.updateAreaServed)

Shiny.addCustomMessageHandler("updateVisibleMonitors", netAssess.updateVisibleMonitors)

Shiny.addCustomMessageHandler("areaServedMonitorUpdate", function(data) {
  netAssess.floaters.areaServed.updateTitle("Area Served - " + data)  
})

Shiny.addCustomMessageHandler("updateTrendChart", function(data) {
  $(".popup-trend").find("img").attr("src", data)
})

Shiny.addCustomMessageHandler("triggerEvent", function(data) {
  $(data.target).trigger(data.event);
})