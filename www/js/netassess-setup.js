// The main variable that stores everything associated with the netAssess app.
var netAssess = {};

// Various small bits of data needed by the app
netAssess.data = {
	newSiteCounter: 90001,
	us_bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]),
	us_center: L.latLng([39.8333, -98.5833]),
}

// The icon objects used by the app
netAssess.icons = {
  existingSite: L.divIcon({className: 'site-icon hidden'}),
	newSite: L.divIcon({className: 'new-site-icon'}),
	siteSelector: L.divIcon({className: 'fa fa-crosshairs new-site-selector'})
}

// Basemaps available to the app
netAssess.basemaps = {
	"Gray": L.layerGroup([L.esri.basemapLayer("Gray"), L.esri.basemapLayer("GrayLabels")]),
	"Street": L.esri.basemapLayer("Streets"),
	"Satellite" : L.esri.basemapLayer("Imagery"),
	"Satellite - Labelled": L.layerGroup([L.esri.basemapLayer("Imagery"), L.esri.basemapLayer("ImageryLabels")])
}

// Overlay maps showing probability of exceedence for ozone and pm2.5. The 
// source of the ozone map is changed based on the selected ozone standard.
netAssess.overlays = {
	o3: L.imageOverlay("images/o3_75.png", [[24.51748, -124.76255], [49.38436, -66.92599]], {opacity: 0.65}),
	pm25: L.imageOverlay("images/pm25_35.png", [[24.51748, -124.76255], [49.38436, -66.92599]], {opacity: 0.65})
}

// Controls used the the app.
netAssess.controls = {
  // Sidebars are controlled by buttons on the left of the map.
	sidebars: {
		settings: L.control.sidebar('settings-sb', {position: 'right', autoPan: false}),
		help:  L.control.sidebar('help-sb', {position: 'right', autoPan: false}),
		about: L.control.sidebar('about-sb', {position: 'right', autoPan: false})
	},
  // Floaters are something I created to replace the need for sidebars for the 
  // more commonly used inputs/outputs. They look and act like windows that can 
  // be opened/closed/minimized/dragged based on the options specified at 
  // creation. See floaters.js.
	floaters: {
		cormat: new $.floater("#cormat", {title: "Correlation Matrix", 
                                      width: "800px", height: "640px;", 
                                      top: "80px", resize: true, left: "80px"}),
		areaServed: new $.floater("#areainfo", {title: "Area Served Information", 
                                            top: "50px", right: "50px"}),
		aoi: new $.floater("#aoi", {title: "Area of Interest"}),
		legend: new $.floater("#legend", {title: "Legend", close: false, 
                                      width: '400px', height: "250px", 
                                      right: "50px", bottom: "50px"}),
		newSite: new $.floater("#new_site", {title: "Add New Site", width: '400px', 
                                         close: false, minimize: false}),
    popup: new $.floater("#popup", {title: "Popup", width: "600px", 
                                    left: "200px", minimize: false})
  }
}

netAssess.mapControls = {
  fullExtent: function() {
  	netAssess.map.fitBounds(netAssess.data.us_bounds);
	}
}

// Create the map
netAssess.map = L.map('map', {
  contextmenu: true, 
	contextmenuWidth: 140, 
	contextmenuItems: [
		{text: "Full Extent", iconCls: "fa fa-search-minus", callback: netAssess.mapControls.fullExtent},
		{text: "Area of Interest", iconCls: "fa fa-crosshairs", callback: netAssess.controls.floaters.aoi.open}
	],
	drawControl: false, 
	zoomControl: false,
	maxZoom: 12, 
	minZoom: 3
}).fitBounds(L.latLngBounds([24.4, -124.8], [49.4, -66.9]));

