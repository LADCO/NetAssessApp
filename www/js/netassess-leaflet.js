L.SiteGroup = L.FeatureGroup.extend({
  options: {
    visibleSites: [],
    selectedSites: [],
    activeSites: [],
    aoiLayer: null,
    correlations: false,
    visibilityTest: function(site) {return false;},
    styles: {unselected: {radius: 4, opacity: 0.67, fillOpacity: 0.67, fillColor: "#800000", color: "#000", weight: 1},
             selected: {radius: 5, opacity: 0.67, fillOpacity: 0.67, fillColor: "#ff4040", color: "#000", weight: 1}
    },
    contextmenu: false
  },
  initialize: function(options) {
    
    L.setOptions(this, options);
    
    this._layers = {};
    
    if(this.options.aoiLayer !== undefined) {
      this.setAOI(this.options.aoiLayer)
    }
    
    this.on("siteupdate", function(event) {
      
      var keys = event.site.properties.key,
          type = event.updateType;
      
      if(type === "select" || type === "deselect") {
        this.fire("selectionupdate", {keys: this.options.selectedSites});
      } else if(type === "show" || type === "hide") {
        this.fire("visibilityupdate", {keys: this.options.visibleSites});
      }    

    })
        
  },
  getSite: function(key) {
    
    var site;
    
    for(var k = 0; k < key.length; k++) {
      this.eachLayer(function(layer) {
        if(layer.properties.key.indexOf(key[k]) != -1) {
          site = layer;
        }
      })
    }

    return site;    
    
  },
  setAOI: function(aoiLayer) {
    this.options.aoiLayer = aoiLayer;
    
    var siteGroup = this;
    this.options.aoiLayer.on("layeradd", function(e) {
      siteGroup.checkAOI();
    })
      
  },
  addGeoJSON: function(geojson) {
    var features = L.Util.isArray(geojson) ? geojson : geojson.features
    var feature, latlng, options;
    
    for(var i = 0; i < features.length; i++) {

      var options = {}
    
      feature = features[i];
      latlng = L.latLng(feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0]);
      this._addSite(latlng, feature.properties, options, false);
      
      this.fire("visibilityupdate", {keys: this.options.visibleSites})
      this.fire("selectionupdate", {keys: this.options.selectedSites})
            
    }
    
    this.setVisibleSites();
    
    return this;
    
  },
  _addSite: function(latlng, properties, options) {
    if(options == undefined) {
      options = {};
    }
    var site = L.siteMarker(latlng, options, properties, this); 
    return site;
  },
  addSite: function(latlng, properties, options) {
    var site = this._addSite(latlng, properties, options);
    this.fire("visibilityupdate", {keys: this.options.visibleSites})
    this.fire("selectionupdate", {keys: this.options.selectedSites})
  },
  testVisibility: function() {
    
    var group = this;
    
    this.eachLayer(function(site) {
      
      if(group.options.visibilityTest(site)) {
        site._show();
      } else {
        site._hide();
      }
            
    })

    this.fire("visibilityupdate", {keys: this.options.visibleSites})

  },
  setVisibleSites: function(keys) {
    
    var layer = this;
    
    if(Array.isArray(keys) == false) {keys = [keys]}
  
    this.eachLayer(function(site) {
      if(site.keyCheck(keys)) {
        site._show();
      } else {
        site._hide();
      }
    })
    
    this.fire("visibilityupdate", {keys: this.options.visibleSites})
    
  },
  setSelectedSites: function(keys) {
    
    var layer = this;
    
    if(Array.isArray(keys) == false) {keys = [keys]}
  
    this.eachLayer(function(site) {
      if(site.keyCheck(keys)) {
        site._select();
      } else {
        site._deselect();
      }
    })
    
    this.fire("selectionupdate", {keys: this.options.selectedSites})
    
  },
  checkAOI: function() {
    if(this.options.aoiLayer !== undefined) {
      this._selectSiteByPolygons(this.options.aoiLayer)
    }
  },
  selectSites: function(obj) {
    this._selectSiteByPolygons(obj);
  },
  _selectSiteByPolygons: function(polygons) {
    
    var selSites = [];
    this.eachLayer(function(site) {
      if(site.inPolygon(polygons)) {
        site._select();
        selSites.push(site.properties.key[0])
      } else {
        site._deselect();
      }
    })
    
    this.options.selectedSites = selSites
    this.fire("selectionupdate", {keys: this.options.selectedSites})
    
  }
})

L.siteGroup = function(geojson, options) {
  return new L.SiteGroup(geojson, options);
}

L.SiteMarker = L.CircleMarker.extend({
  options: {
    selected: false,
    visible: false,
  },
  initialize: function(latlng, options, properties, parent) {
    
    var defaultOptions = {
      opacity: 0,
      fillOpacity: 0,
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuItems: [
        {text: "Select Monitor", index: 0, callback: function() {this.select()}},
        {text: "Hide Monitor", index: 1, callback: function() {this.hide()}}
      ]
    }

    L.extend(defaultOptions, options)

    for(var i = 0; i < defaultOptions.contextmenuItems.length; i++) {
      defaultOptions.contextmenuItems[i].context = this;
    }

    L.setOptions(this, defaultOptions);
    
    properties.key = Array.isArray(properties.key) == false ? [properties.key] : properties.key;
    
    this._latlng = L.latLng(latlng);
    this._radius = this.options.radius;
    this.properties = properties;
    this._parent = parent;
    
    if(this._parent.options.aoiLayer !== undefined) {
      if(this.inPolygon(this._parent.options.aoiLayer)) {
        this._select();
      } else {
        this._deselect();
      }
    } else {
      this._deselect();
    }    
    
    parent.addLayer(this);
  
    if(this._parent.options.visibilityTest(this)) {
      this._show();
    } else {
      this._hide();
    }
      
    if(this._parent.options.onEachSite !== undefined) {
      this._parent.options.onEachSite(this)
    }
      
    return this;
    
  },
  setMarkerStyle: function(style) {
    this.setStyle(this._parent.options.styles[style]);
  },
  select: function() {
    this._select();
    this._parent.fireEvent("siteupdate", {site: this, updateType: "select"})
  },
  _select: function(fire) {
    
    this.options.selected = true;
    if(this.options.contextmenu == true) {
      this.options.contextmenuItems[0].text = "Deselect Monitor";
      this.options.contextmenuItems[0].callback = function() {this.deselect()};
      if(this._parent.options.correlations == true) {
        this.options.contextmenuItems[2] = {text: "Show Correlation", callback: this.correlate, context: this}
      } else {
        this.options.contextmenuItems[2] = null;
      }
    }
    if(this.keyCheck(this._parent.options.selectedSites) == false) {
      this._parent.options.selectedSites = this._parent.options.selectedSites.concat(this.properties.key)
    }
    this.setMarkerStyle("selected");
    
  },
  correlate: function() {
    this.options.contextmenuItems[2] = {text: "Hide Correlation", callback: this.decorrelate, context: this};
    this._parent.fireEvent("correlate", {site: this});
  },
  decorrelate: function() {
      this._parent.fireEvent("decorrelate", {site: this});
  },
  deselect: function() {
    this._deselect();
    this._parent.fireEvent("siteupdate", {site: this, updateType: "deselect"})
  },
  _deselect: function() {
    this.options.selected = false;
    if(this.options.contextmenu == true) {
      this.options.contextmenuItems[0].text = "Select Monitor";
      this.options.contextmenuItems[0].callback = function() {this.select()};
      this.options.contextmenuItems[2] = null;
    }
    if(this.keyCheck(this._parent.options.selectedSites)) {
      for(var i = 0; i < this.properties.key.length; i++) {
        var n = this._parent.options.selectedSites.indexOf(this.properties.key[i]);
        if(n != -1) {
          this._parent.options.selectedSites.splice(n, 1);
        }
      }
    }
    this.setMarkerStyle("unselected");
  },
  show: function() {
    this._show();
    this._parent.fireEvent("siteupdate", {site: this, updateType: "show"});
  },
  _show: function() {
    this.options.visible = true;
    if(this.keyCheck(this._parent.options.visibleSites) == false) {
      this._parent.options.visibleSites = this._parent.options.visibleSites.concat(this.properties.key)
    }
    if(this._parent.options.correlations == true && this.options.contextmenu == true && this.options.selected == true) {
      this.options.contextmenuItems[2] = {text: "Show Correlation", callback: this.correlate, context: this}
    } else {
      this.options.contextmenuItems[2] = null;
    }
    this._container.children[0].style.display = "block";
  },
  hide: function() {
    this._hide();
    this._parent.fireEvent("siteupdate", {site: this, updateType: "hide"})
  },
  _hide: function() {
    this.options.visible = false;
    if(this.keyCheck(this._parent.options.visibleSites)) {
      for(var i = 0; i < this.properties.key.length; i++) {
        var n = this._parent.options.visibleSites.indexOf(this.properties.key[i]);
        if(n != -1) {
          this._parent.options.visibleSites.splice(n, 1);
        }
      }
    }
    if(this.options.contextmenu == true) {
      this.options.contextmenuItems[2] = null;
    }
    this._container.children[0].style.display = "none";
  },
  inPolygon: function(polygons, pip) {
    
    if(polygons === undefined) return false;
    
    var t = this;
    if(pip === undefined) pip = false;
    var point = this._latlng;
    
    if(!pip) {
      polygons.eachLayer(function(polygon) {
      
        var coords = polygon._latlngs;

        if(coords !== undefined) {

          var j = coords.length - 1
          var inside = false;
     
          for(var i = 0; i < coords.length; i++) {
      		  if(((coords[i].lat > point.lat) != (coords[j].lat > point.lat)) &&
      			  (point.lng < (coords[j].lng - coords[i].lng) * (point.lat - coords[i].lat) / (coords[j].lat - coords[i].lat) + coords[i].lng)) {
      			  inside = !inside;
      			}
      		
      		  j = i;
      	  }
          
          if(inside) {pip = true};
      
        } else {
          if(t.inPolygon(polygon, pip)) {pip = true;}
        }
      
      })
    
    }
    
    return pip;
    
  },
  keyCheck: function(keys) {
    keys = Array.isArray(keys) == false ? [keys]: keys;
    var myKey = this.properties.key;
    var inc = false;
    myKey = Array.isArray(myKey) == false ? [myKey]: myKey;
    for(var i = 0; i < myKey.length; i++) {
      if(keys.indexOf(myKey[i]) != -1) {
        inc = true;
        break;
      }
    }
    return inc;
  }
  
})

L.siteMarker = function(latlng, options, properties, parent) {
  return new L.SiteMarker(latlng, options, properties, parent)
}