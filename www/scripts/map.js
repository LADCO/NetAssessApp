      function getColor(d) {
			
				return d > 750 ? "#800026":
					   d > 90 ? "#E31A1C":
					   d > 20 ? "#FD8D3C":
									"#FED976";
			}
		
			function style(feature) {
				return {
					fillColor: getColor(feature.properties.POP12_SQMI), 
					weight: 1, 
					color: "#AAA",
					opacity: 1
				}
			}
			function highlightFeature(e) {
				var layer = e.target;

				layer.setStyle({
					weight: 5,
					color: '#888',
					dashArray: '',
				});

				if (!L.Browser.ie && !L.Browser.opera) {
					layer.bringToFront();
				}
			}
			
			function resetHighlight(e) {
				voronoi.resetStyle(e.target);
			}
			
			function onEachFeature(feature, layer) {
				layer.on({
					mouseover: highlightFeature,
					mouseout: resetHighlight
				});
			}







// Define bounds and center of continental us
var us = {bounds: L.latLngBounds([20, -150], [55, -50]),
          center: L.latLng([39.8333, -98.5833])
}

function mapResize(el) {
  document.getElementById(el).style.height = (window.innerHeight - 50) + "px"
  document.getElementById(el).style.width = window.innerWidth + "px"
};

$(window).resize(function () { 
  mapResize("map")
});
    
mapResize("map");

var map = L.map('map', {center: us.center, zoom: 5, maxBounds: us.bounds, 
              					maxZoom: 12, minZoom: 3, zoomControl: false})

L.esri.basemapLayer("Gray").addTo(map);
L.esri.basemapLayer("GrayLabels").addTo(map);

var myIcon = L.divIcon({className: 'map-icon'});

var voronoi;

$.ajax({
  dataType: "json",
	url: "data/areatest.geojson",
	success: function(data) {
		voronoi = L.geoJson(data, {
			style: style,
			onEachFeature: onEachFeature
		}).addTo(map);
	}
	}).error(function() {});

$.ajax({
  dataType: "json",
  url: "data/monitors.geojson",
  success: function(data) {
    monitors = L.geoJson(data, {
      pointToLayer: function(feature, latlon) {return new L.marker(latlon, {icon: myIcon}).addTo(map);},
      onEachFeature: function(feature, layer) {
        layer.bindPopup(feature.properties["o3.MONITOR_ID"]);
      }
    }).addTo(map);          
  }
})