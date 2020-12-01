// Code by Sungbok Shin, D3, V6 Bar Chart

var bar_margin = { top: 10, right: 30, bottom: 30, left: 30 },
    bar_width = 350 - bar_margin.left - bar_margin.right,
    bar_height = 350 - bar_margin.top - bar_margin.bottom;

//var bar_chart = document.getElementById("daily_bar")

var parseDate = d3.timeParse("%d");

// set the ranges
var x_bar = d3.scaleBand()
          .range([0, bar_width])
          .padding(0.1);
var y_bar = d3.scaleLinear()
          .range([bar_height,0]);


var bar_svg = d3.select("#daily_bar")
    .append("svg")
    .attr("width", bar_width + bar_margin.left + bar_margin.right)
    .attr("height", bar_height + bar_margin.top + bar_margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + bar_margin.left + "," + bar_margin.top + ")");


d3.csv("daily.csv").then(function (data) {

    data.forEach(function (d) {
        d.day = parseDate(d.day);
        d.value = +d.infection_occured;
    })

    
    x_bar.domain(data.map(function(d) { return d.day; }));
    y_bar.domain([0, d3.max(data, function(d) { return d.value; })]);


    bar_svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x_bar(d.day); })
        .attr("width", x_bar.bandwidth())
        .attr("y", function (d) { return y_bar(d.value); })
        .attr("height", function (d) { return bar_height - y_bar(d.value); });

})