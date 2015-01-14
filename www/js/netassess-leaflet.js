netAssess.sitesMarker = L.Marker.extend({
  select: function() {
    $(this._icon).addClass("selected");
    this.options.contextmenuItems[0].text = "Deselect Monitor"
    this.options.contextmenuItems[0].callback = function() {this.deselect()};
  	this.feature.properties.selected = true;
  },
  deselect: function() {
    $(this._icon).removeClass("selected");
    this.options.contextmenuItems[0].text = "Select Monitor"
    this.options.contextmenuItems[0].callback = function() {this.select()};
    this.feature.properties.selected = false;
  },
  show: function() {
    $(this._icon).removeClass("hidden");
  },
  hide: function() {
    $(this._icon).addClass("hidden");
    this.deselect();
  }
});

netAssess.siteLayer = L.GeoJson.extend({})