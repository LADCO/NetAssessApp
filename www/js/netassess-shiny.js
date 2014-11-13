/* Input Bindings for custom shiny inputs */

  // Input that informs shiny about the monitoring locations that have been 
  // selected.
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
  
  // Input that informs shiny about currently visible monitoring locations. This
  // really complicated things but was necessary to allow users to remove a 
  // monitor within an area of interest that they didn't want to affect analysis
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
  
  // Input that updates when an area served polygon is clicked. Allows shiny to
  // provide demographic and geographic information about that area, including
  // the age pyramid plot.
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
  
  // Input that updates when a monitoring location is selected. This was used
  // when the demographic/geographic data was handled differently. Still here
  // in case I need it later.
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

  // Binding to let shiny know what the currently selected area of interest is. 
  // Used for clipping area served polygons.
  var areaOfInterestBinding = new Shiny.InputBinding();
  $.extend(areaOfInterestBinding, {
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
  Shiny.inputBindings.register(areaOfInterestBinding);




/* Custom Message Handlers */

Shiny.addCustomMessageHandler("displayPredefinedArea", setPredefinedArea);

Shiny.addCustomMessageHandler("updateAreaServed", updateAreaServed)

Shiny.addCustomMessageHandler("updateVisibleMonitors", updateVisibleMonitors)

