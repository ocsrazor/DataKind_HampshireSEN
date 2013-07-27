Meteor.subscribe("students");
Meteor.subscribe("lsoas");
Meteor.subscribe("schools");

var Router = Backbone.Router.extend({
  routes: {
    "": "main",
    "map": "map",
    "table" : "table"
  },

  main: function () {
    console.log("home route");
    Session.set("page", "home");
  },

  map: function () {
  	console.log("map route");
  	Session.set("page", "map");
  },

  table: function () {
  	console.log("table route");
  	Session.set("page", "table");
  }

});

Template.page.mapRoute = function () {
  if(Session.get("page") === "map") return true;
  else return false;
};

Template.page.tableRoute = function () {
  if(Session.get("page") === "table") return true;
  else return false;
};

Template.page.homeRoute = function () {
  if(Session.get("page") === "home") return true;
  else return false;
};

Template.map.students = function () {
  return Students.find();
};

Template.map.lsoas = function () {
  return LSOAs.find();
};

Template.map.schools  = function () {
  return Schools.find();
};

Template.map.rendered = function () {
  Meteor.generateMap();
}

var mskiRouter = new Router;

Meteor.startup(function () {

  Meteor.startup(function () {
    Backbone.history.start({pushState: true});
  });

  Meteor.autorun(function () {
    //Meteor.subscribe("queries");
    //Session.set("loginError", false);
  });
});

Meteor.generateMap = function(){
  
  d3.select("svg").remove();
  d3.select("#map").attr("style","width:100%; height:500px; float:left");
  var width = $("#map").width(), 
      height = $("#map").height();
  var centered;

  var tooltip = d3.tooltip();

  var color = d3.scale.threshold()
    .domain([0, 2, 4, 6, 8, 10])  // This is a hardwired scale for the deprivation index.
    .range(colorbrewer.YlOrRd[7]);
    console.log(color);

  mapVis = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

  var projection = d3.geo.albers()
    .center([2.5, 51.1])
    .rotate([4.4, 0])
    .scale(1200 * 30);

  var path = d3.geo.path()
      .projection(projection);

  var mapGroup = mapVis.append("g");
  var layerHants = mapGroup.append("g");

  function centre_and_bound_projection(geojson_object) {
    projection
        .scale(1)
        .translate([0, 0]);

    var b = path.bounds(geojson_object),
        s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);
  };

  function click(d) {
      var x, y, k;

      if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 10; // Zoom factor
        centered = d;
      } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
      }

      mapGroup.selectAll("path")
          .classed("active", centered && function(d) { return d === centered; });

      mapGroup.transition()
          .duration(1500)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
          .style("stroke-width", 1.5 / k + "px");
  };

  d3.json("data/LSOA_hants_simplify0.75_simplify-proportion0.5.topo.json", function(hantsData) {

    var objectid = 'LSOA_hants_simplify0.75';
    var hantsLsoa = topojson.feature(hantsData, hantsData.objects[objectid]);

    var data = hampshireDataManager.getCleanedData();
    // console.log(data);

    // Processing of data to get deprivation index
    var deprivationById = {};
    data.forEach(function(d) { deprivationById[d.LSOA_CODE] = d.IMD_SCORE;  });
    minmax_deprivation = d3.extent(data, function(d) { return d.IMD_SCORE; });
    console.log(minmax_deprivation);

    // Create the outline of the LSOAs
    layerHants.append("path")
      .datum(topojson.mesh(hantsData, hantsData.objects[objectid]))
      .attr("class", "lsoa-boundary")
      .attr("d", path);

    // Create the filling of the LSOAs
    layerHants.selectAll(".lsoa")
      .data(hantsLsoa.features)
      .enter().append("path")
      .attr("class", "lsoa")
      .style("fill", function(d) { return color(deprivationById[d.id]) })
      .attr("d", path)
      .on("click", click)
      .on("mouseover", function(d) { tooltip.show(d); })
      .on("mousemove", function() { tooltip.move(); })
      .on("mouseout", function() { tooltip.hide(); } );


    // Legend
    var formatNumber = d3.format(",r");
    var x = d3.scale.linear()
      .domain([0, 10])  // Need to automate this
      .range([0, 300]); // Sets the screen width of the legend

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(0)
      .tickValues(color.domain())
      .tickFormat(function(d) { return formatNumber(d); });

    var key = mapVis.append("g")
      .attr("class", "key")
      .attr("transform", "translate(650,20)"); //Need to auto adjust this

    key.selectAll("rect")
      .data(color.range().map(function(d, i) {
        return {
          x0: i ? x(color.domain()[i - 1]) : x.range()[0],
          x1: i < color.domain().length ? x(color.domain()[i]) : x.range()[1],
          z: d
        };
      }))
    .enter().append("rect")
      .classed("colorbar",true)
      .attr("height", 8)
      .attr("x", function(d) { return d.x0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .style("fill", function(d) { return d.z; })
      .style("stroke-width","0.5px")
      .style("stroke","black");

    key.call(xAxis).append("text")
      .attr("class", "caption")
      .attr("y", -6)
      .text("Index of deprivation");



  });
}


