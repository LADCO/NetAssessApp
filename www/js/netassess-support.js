function resetPredefinedAreaSelect() {
  $('input[name=areaSelect]').attr('checked', false);
  document.getElementById('areaSelectSelect').selectedIndex = -1;
}

var loading = {
  show: function() {
    $("div.loading").removeClass("hidden");
  },
  hide: function() {
    $("div.loading").addClass("hidden");
  }
}

// Set the dimensions of the map div to fill all available space
function resizeMap() {
	document.getElementById("map").style.width = window.innerWidth + "px";
	document.getElementById("map").style.height = (window.innerHeight - 40) + "px";
}

// Toggles the provided sidebar panel, and makes sure all others are closed.
function toggleSidebars(sb) {

	for(var x in sidebars) {
		if(sidebars.hasOwnProperty(x)) {
			if(x == sb) {
				sidebars[sb].toggle();
			} else {
				sidebars[x].hide();
			}
		}
	};
	
}

function setAOI(e) {
	
  if(e.hasOwnProperty("layer")) {
    var l = e.layer;
    var t = e.layerType;
  } else {
    var l = e;
    var t = "polygon";
  }
  
	function checkPolygon(x) {

    var inside = false;
    
    if(this.hasOwnProperty("_layers")) {
      this.eachLayer(function(layer) {
        if(pip(x._latlng, layer)) {inside = true}
      })
    } else {
      inside = pip(x._latlng, this);
    }
    
		if(inside) {
			$(x._icon).addClass("selected");
			x.feature.properties.selected = true;
		} else {
			$(x._icon).removeClass("selected");
			x.feature.properties.selected = false;
		}

	}

  function checkCircle(x) {
  
    if(this._latlng.distanceTo(x._latlng) <= this._mRadius) {
  		$(x._icon).addClass("selected");
			x.feature.properties.selected = true;      
    } else {
  		$(x._icon).removeClass("selected");
			x.feature.properties.selected = false;
    }
  
  }

	aoi.clearLayers();
	aoi.addLayer(l);
	
	aoi.on("click", function(l) {
		map.fitBounds(l.layer.getBounds());
	})
	
	if(t == "polygon") {
		sites.eachLayer(checkPolygon, l);
	} else if(t == "rectangle") {
  	sites.eachLayer(checkPolygon, l);
	} else if(t == "circle") {
    sites.eachLayer(checkCircle, l);
	} else {
		alert("Unknown Input")
	}
  
  displaySites();

}

// Function to test if point falls within a polygon
// Converted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
function pip(point, polygon) {
	var coords = polygon._latlngs;
	var inside = false;
	var j = coords.length - 1
	for(var i = 0; i < coords.length; i++) {
		if(((coords[i].lat > point.lat) != (coords[j].lat > point.lat)) &&
			(point.lng < (coords[j].lng - coords[i].lng) * (point.lat - coords[i].lat) / (coords[j].lat - coords[i].lat) + coords[i].lng)) {
				inside = !inside;
			}
		
		j = i;
	}	
	
	return inside;
}

// Functions for styling map elements
var siteIcon = L.divIcon({className: 'site-icon hidden'});

function getColor(d) {
	return d > 750 ? "#800026":
		   d > 90 ? "#E31A1C":
		   d > 20 ? "#FD8D3C":
					"#FED976";
};

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

// Function to highlight areaServed polygons
function highlightAreaServed(e) {
  var layer = e.target;
  
  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });
  
  if(!L.Browser.id && !L.Browser.opera) {
    layer.bringToFront();
  }
  
}

var areaSelectStyle = {
    fillColor: '#666',
    weight: 2,
    opacity: 0.75,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.4
  }

// Function to unhighlight areaServed polygons
function unhighlightAreaServed(e) {
  e.target.setStyle(areaSelectStyle);
}

function displaySites() {
  
  sites.eachLayer(function(layer) {
    if(layer.feature.properties.visible == false) {
      $(layer._icon).addClass("hidden");
    } else {
      $(layer._icon).removeClass("hidden");
      if(layer.feature.properties.selected == false) {
        $(layer._icon).removeClass("selected");
      } else {
        $(layer._icon).addClass("selected");
      }
    }
  });
  
}

function createSitePopup(feature, layer) {
  
  po = "<span class = 'popup-text'><h4 class = 'popup-header'>Site Information</h4>"
  po = po + "<span class = 'popup-subheader'>Site ID(s)</span><br />"
  for(si in feature.properties.site_id) {
    po = po + feature.properties.site_id[si] + "<br />"
  }
  po = po + "<span class = 'popup-subheader'>Street Address</span><br />"
  po = po + feature.properties.Street_Address + "<br />"
  po = po + "<span class = 'popup-subheader'>Parameter Counts</span><br />"
  po = po + "<b>Total:</b> " + feature.properties.Count + "<br />"
  po = po + "<b>Criteria:</b> " + feature.properties.Crit_Count + "<br />"
  po = po + "<b>HAPS:</b> " + feature.properties.HAP_Count + "<br />"
  po = po + "<b>Met:</b> " + feature.properties.Met_Count + "<br />"
  
  po = po + "</span>"
  
  layer.bindPopup(po, {minWidth: 150});
  layer.on("click", function(el) {
    $("#monitorSelect").data("monitor", this.feature.properties.key)
    $("#map").trigger("monitorSelect")
  })
  
}

(function($) {
    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });

    }
})(jQuery);
