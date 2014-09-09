      var areaselect = null;
      
      function selectArea() {

        if(areaselect == null) {
          addAreaSelect();
        } else {
          removeAreaSelect();
        }
      
      }   
      
      function addAreaSelect() {
        areaselect = L.areaSelect({width: 200, height: 200}).addTo(map);
        document.getElementById("bb-select").innerHTML = '<i class = "fa fa-2x fa-fw fa-check"></i><br/>Select'
        document.getElementById("bb-select").width = 25;
      }
      
      var bounds;
      
      function removeAreaSelect() {
        bounds = areaselect.getBounds();
        $("#bb-north").val(Number(bounds._northEast.lat).toFixed(3));
        $("#bb-east").val(Number(bounds._northEast.lng).toFixed(3));
        $("#bb-south").val(Number(bounds._southWest.lat).toFixed(3));
        $("#bb-west").val(Number(bounds._southWest.lng).toFixed(3));
        document.getElementById("bb-select").innerHTML = '<i class = "fa fa-2x fa-fw fa-crop"></i><br/>Select'
        areaselect.remove();
        areaselect = null;
        
        monitors.eachLayer(function(x) {
          if(bounds.contains(x._latlng)) {
            $(x._icon).addClass("selected");
          } else {
            $(x._icon).removeClass("selected");
          }
        })
        
      }