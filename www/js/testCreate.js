L.Control.dropdown = L.Control.extend({

	options: {
		position: 'topleft',
		title: '',
		intendedIcon: 'fa-circle-o',
		value: '',
		values: ['test', 'test2', 'test3']
	},
	
	onAdd: function() {
		var container = L.DomUtil.create("div", 'leaflet-bar leaflet-control leaflet-dropdown');
		
		this.link = L.DomUtil.create("a", 'leaflet-bar-part', container);
		L.DomUtil.create('i', 'fa fa-lg ' + this.options.intendedIcon, this.link);
		this.link.href = "#";
		
		var select = L.DomUtil.create("select", 'leaflet-dropdown-select', container);
		
		for(v in this.options.values) {
			var opt = L.DomUtil.create("option", 'leaflet-dropdown-option', select);
			opt.innerHTML = this.options.values[v];
		}
		
//		L.DomEvent.addListener(container, "click", this._click, this);
		L.DomEvent.addListener(container, "mouseover", this._click, this);
		L.DomEvent.addListener(container, "mouseout", this._click, this);
		
		this.link.title = this.options.title;
		
		return container;
		
	},
	
	intendedFunction: function() {alert('no function selected');},
	
	_expand: function(e) {
	},
	
	_contract: function(e) {
//		this._container.style.width = "";
	},
	
	_click: function(e) {
		L.DomEvent.stopPropagation(e);
		L.DomEvent.preventDefault(e);
		
		if(L.DomUtil.hasClass(this._container, "open")) {
			L.DomUtil.removeClass(this._container, "open")
		} else {
			L.DomUtil.addClass(this._container, "open")
		}
		
	}

});

L.dropdown = function( btnIcon , btnFunction , btnTitle , btnMap ) {

	var newControl = new L.Control.dropdown;
	
	if (btnIcon) newControl.options.intendedIcon = btnIcon;
	
	if ( typeof btnFunction === 'function'){
		newControl.intendedFunction = btnFunction;
	}
	
	if (btnTitle) newControl.options.title = btnTitle;
	
	if ( btnMap == '' ){
		// skip auto addition
	} else if ( btnMap ) {
		btnMap.addControl(newControl);
	} else {
		map.addControl(newControl);
	}
	
	return newControl;
	
};