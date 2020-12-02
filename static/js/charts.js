// Code by Sungbok Shin, D3, V6 Line Chart

function remove_charts() {
    document.getElementById("daily_bar").innerHTML="";
    document.getElementById("daily_total").innerHTML="";
}

function draw_line_chart(file_address) {
    d3.csv(file_address).then(function (data) {

        var line_margin = { top: 10, right: 30, bottom: 30, left: 30 },
            line_width = 350 - line_margin.left - line_margin.right,
            line_height = 350 - line_margin.top - line_margin.bottom;


        var parseDate = d3.timeParse("%d");

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



        data.forEach(function (d) {
            d.day = parseDate(d.day);
            d.value = +d.infection_occured;

        })


        x_line.domain(data.map(function (d) { return d.day; }));
        y_line.domain([0, d3.max(data, function (d) { return d.value; })]);

        line_svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#C43A3A")
            .attr("d", d3.line()
                .x(function (d) { return x_line(d.day) })
                .y(function (d) { return y_line(d.value) })
            )

        //.tickValues(x_bar.domain().filter(function(d,i){ return !(i%5)})

        line_svg.append('g').call(d3.axisBottom(x_line)
            .tickValues(x_line.domain().filter(function (d, i) { return !(i % 2) }))
            .tickFormat(d3.timeFormat("%d")))
            .attr("transform",
                "translate(" + 0 + "," + line_height + ")");
        line_svg.append('g').call(d3.axisLeft(y_line));
    })

}


function draw_bar_chart(file_address) {
    d3.csv(file_address).then(function (data) {


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
            .range([bar_height, 0]);


        var bar_svg = d3.select("#daily_bar")
            .append("svg")
            .attr("width", bar_width + bar_margin.left + bar_margin.right)
            .attr("height", bar_height + bar_margin.top + bar_margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + bar_margin.left + "," + bar_margin.top + ")");



        data.forEach(function (d) {
            d.day = parseDate(d.day);
            d.value = +d.infection_occured;
        })


        x_bar.domain(data.map(function (d) { return d.day; }));
        y_bar.domain([0, d3.max(data, function (d) { return d.value; })]);


        bar_svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return x_bar(d.day); })
            .attr("fill", "#C43A3A")
            .attr("width", x_bar.bandwidth())
            .attr("y", function (d) { return y_bar(d.value); })
            .attr("height", function (d) { return bar_height - y_bar(d.value); });


        bar_svg.append('g')
            .attr("class", "axis")
            .attr("transform",
                "translate(" + 0 + "," + bar_height + ")")
            .call(d3.axisBottom(x_bar)
                .tickValues(x_bar.domain().filter(function (d, i) { return !(i % 2) }))
                .tickFormat(d3.timeFormat("%d")));

        bar_svg.append('g').call(d3.axisLeft(y_bar));

    })
}