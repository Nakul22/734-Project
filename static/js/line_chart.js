// Code by Sungbok Shin, D3, V6 Line Chart

var line_margin = { top: 10, right: 30, bottom: 30, left: 30 },
    line_width = 350 - line_margin.left - line_margin.right,
    line_height = 350 - line_margin.top - line_margin.bottom;

var x_line = d3.scaleBand()
    .range([0, line_width]);
var y_line = d3.scaleLinear()
    .range([line_height, 0]);

var line_svg = d3.select("#daily_total")
    .append("svg")
    .attr("width", line_width + line_margin.left + line_margin.right)
    .attr("height", line_height + line_margin.top + line_margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + line_margin.left + "," + line_margin.top + ")");

d3.csv("daily_cum.csv").then(function (data) {

    data.forEach(function (d) {
        d.day = parseDate(d.day);
        d.value = +d.infection_occured;

    })


    x_line.domain(data.map(function (d) { return d.day; }));
    y_line.domain([0, d3.max(data, function (d) { return d.value; })]);

    line_svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("d", d3.line()
            .x(function (d) { return x_line(d.day) })
            .y(function (d) { return y_line(d.value) })
        )
    
        line_svg.append('g').call(d3.axisBottom(x_line))
        .attr("transform",
            "translate(" + 0 + "," + line_height + ")");
        line_svg.append('g').call(d3.axisLeft(y_line));
})