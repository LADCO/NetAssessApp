// Can be called to make the map expand/shrink to fit the available window space
netAssess.resizeMap = function() {
  document.getElementById("map").style.width = window.innerWidth + "px";
	document.getElementById("map").style.height = (window.innerHeight - 40) + "px";
}

// Functions to display/hide the loading animation
netAssess.loading = {
	show: function() {
		$("div.loading").removeClass("hidden");
	},
	hide: function() {
		$("div.loading").addClass("hidden");
	}
}

