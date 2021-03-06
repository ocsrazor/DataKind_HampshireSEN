d3.tooltip = {};

d3.tooltip = function module() {
	// Defaults
	var width = 100,
        height = width;

    function exports(_selection) {
        _selection.each(function(_data) {
        	// Chart code here
    	});
    }
    // Private functions
    tooltipSelection = function() {
    	return d3.select('.tooltip');
    }
	// Getter/setters
    exports.width = function(_x) {
        if (!arguments.length) return width;
        width = parseInt(_x);
        return this;
    };
    exports.height = function(_x) {
        if (!arguments.length) return height;
        height = parseInt(_x);
        return this;
    };
    exports.show = function (_d) {
    	var tooltipSel = tooltipSelection();
    	tooltipSel
	      .classed("hidden", false);

	    tooltipSel
	      .select('.tooltip-title')
	      .text(_d.properties.LA_NAME);
	    tooltipSel.select('.tooltip-label.var0')
	      .text("IMD: "+d3.round(_d.properties.IMD_SCORE,1));
      tooltipSel.select('.tooltip-label.var1')
        .text("LSOA: "+_d.id);

  	};
  	exports.move = function() {
  		var tooltipSel = tooltipSelection();
		tooltipSel
		    .style("left", (d3.event.pageX) - 70 + "px")     
		    .style("top", (d3.event.pageY - 130) + "px");  
  	};
  	exports.hide = function () {
  		var tooltipSel = tooltipSelection();
  		tooltipSel
    		.classed("hidden", true);
  	};
    return exports;
};
