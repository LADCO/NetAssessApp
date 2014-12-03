var netAssess = {};

// Stores information about the location of the Continental United States
netAssess.us = {
	bounds: L.latLngBounds([24.4, -124.8], [49.4, -66.9]),
	center: L.latLng([39.8333, -98.5833])
}

	// Create basemap layers with Esri-Leaflet
netAssess.basemaps = {
	"Gray": L.layerGroup([L.esri.basemapLayer("Gray"), L.esri.basemapLayer("GrayLabels")]),
	"Street": L.esri.basemapLayer("Streets"),
	"Satellite": L.esri.basemapLayer("Imagery"),
	"Satellite - Labelled": L.layerGroup([L.esri.basemapLayer("Imagery"), L.esri.basemapLayer("ImageryLabels")])
};

	// Object containing divIcons types for the map
netAssess.icons = {
	"existing":	L.divIcon({className: 'site-icon hidden'}),
	"new":		L.divIcon({className: 'new-site-icon'}),
	"selector":	L.divIcon({className: 'fa fa-crosshairs new-site-selector'})
}

// Creates the map object on which all else relies
netAssess.map = L.map(mapID, {
	contextmenu: true, 
	contextmenuWidth: 140, 
	contextmenuItems: [
		{text: "Full Extent", iconCls: "fa fa-search-minus", callback: fullExtent},
		{text: "Area of Interest", iconCls: "fa fa-crosshairs", callback: aoiFloat.open}
	],
	drawControl: false, 
	zoomControl: false,
	maxZoom: 12, 
	minZoom: 3
})

netAssess.map.fitBounds(netAssess.us.bounds);

