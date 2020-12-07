
var times, chart, contains, contains_nodes, loader, sim;
var chart_date, prev_chart_date, file_name_bar, file_name_line;
var button_group = document.getElementById('day_buttons')
var dates_range = document.getElementById('dates_range')
var infection_range = document.getElementById('infection_counter')
var infected_nodes = new Set();
var count = 0;
var paused_count = 0;
var simulation, drag;
var selected_node;
var linkedByIndex = {};

//utility function to force timeout
const delay = ms => new Promise(res => setTimeout(res, ms));

function create_viz() {
  // var day1 = data[0]
  // console.log(day1)
  simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink().id(d => d.id))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide(30))
    .on("tick", ticked);


  let link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 3)
    .selectAll("line");

  let node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle");

  var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("opacity", 0)
    .text("a simple tooltip");

  function ticked() {
    node.attr("cx", d => d.x)
      .attr("cy", d => d.y);

    link.attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
  }

  // invalidation.then(() => simulation.stop())
  drag = simulation => {

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function clicked(d) {
    //d is the actual mouseclick event
    //  console.log()

    if (!d3.select(this).attr('classed')) {

      //get the selected node
      d3.select(this).attr('classed', true)
      selected_node = d3.select(this).data();

      //show tooltip
      tooltip
          .transition()
          .duration(500)
          .text('Person: '+ selected_node[0].id)
          .style('opacity', 1)
          .style("top", (d.pageY-10)+"px")
          .style("left",(d.pageX+10)+"px");

      //highlight the links for the connected node.
      link.style("opacity", function (o) {
        return connected_links(o) ? 1 : 0.25;
      });
      node.style("opacity", function (o) {
        if (o.id == selected_node[0].id) {
          return 1
        }
        return neighboring(o, selected_node) ? 1 : 0.25;
      });
    } else {
      selected_node = null;
      d3.select(this).attr('classed', null)
      link.style("opacity", 1);
      node.style("opacity", 1);

      tooltip.text('Click Me').style('opacity', 0)
    }

  }

  function connected_links(c_link) {
    return c_link.source.id === selected_node[0].id || c_link.target.id === selected_node[0].id
  }

  function neighboring(a, b) {
    if (a.id < b[0].id) {
      return linkedByIndex[a.id + "," + b[0].id];
    } else {
      return linkedByIndex[b[0].id + "," + a.id];
    }

  }
  return Object.assign(svg.node(), {
    update({ nodes, links }) {
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      async function wait() {
        await delay(10000)
      }
      const old = new Map(node.data().map(d => [d.id, d]));
      nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
      links = links.map(d => Object.assign({}, d));

      node = node
        .data(nodes, d => d.id)
        .join(enter => enter.append("circle")
          .attr("r", 8)
          .style('fill', 'grey')
          .style('opacity', function (d) {
            if (selected_node) {
              if (d.id == selected_node[0].id) {
                return 1
              }
              return neighboring(d, selected_node) ? 1 : 0.25;
            }
            return 1
          })
          .call(drag(simulation))
          .call(node => node.append("title").text(d => d.id)))
        .on('click', clicked)
        .on('mouseover', function(d){
          tooltip.text('Click Me').style('opacity', 1)
        })
        .on('mousemove', function(d){
          tooltip.text('Click Me');
          var p = d3.select(this).data()
          tooltip
          .style('opacity', 1)
          .style("top", (d.pageY-10)+"px")
          .style("left",(d.pageX+10)+"px");
        })
        .on('mouseout', function(d){
          tooltip.style('opacity', 0)
        });

      wait()
      svg.selectAll('circle')
        .transition()
        .duration(750)
        .style('fill', function (d) {
          if (d.infected) {
            infected_nodes.add(d.id)
            if (d.tested && d.test_result === undefined) {

              return '#CBBE4B'
            } else if (d.test_result && d.test_result === 'positive') {

              if (d.status === 'PQ') {

                return '#F32626'
              }
              if (d.status === "FN") {
                return '#F0610F'
              }

            }
            return '#A60823'
          }

          infected_nodes.delete(d.id)
          return "gray"
        });

      //reset link by index so it stores links for every time step
      linkedByIndex = {}
      links.forEach(function (d) {
        if (d.source < d.target) {
          linkedByIndex[d.source + "," + d.target] = 1;
        } else {
          linkedByIndex[d.target + "," + d.source] = 1;
        }

      });

      link = link
        .data(links, d => [d.source, d.target])
        .join(enter => enter.append("line")
          .attr("stroke", function (d) {
            if (d.infection_occured) {
              return '#FF0000'
            }
            if (d.masked) {
              return '#218295'
            }
            return "#999"
          })
          .style('stroke-dasharray', function (d) {
            if (d.masked)
              return ('3,3')
            return "#999"
          })
          .style('opacity', function (d) {
            if (selected_node) {
              return connected_links(d) ? 1 : 0.25;
            }
            return 1
          })
        );

      simulation.nodes(nodes);
      simulation.force("link").links(links);
      simulation.alpha(1).restart().tick();
      ticked(); // render now

      //update total cases counter
      var cases = getTotalCases()
      if (cases !== undefined && cases.length > 0) {
        if (paused) {
          if (cases[times[paused_count].getDate() - 1] !== undefined) {
            infection_range.innerHTML = cases[times[paused_count].getDate() - 1].value
          }
        } else {
          if (cases[times[count].getDate() - 1] !== undefined) {
            infection_range.innerHTML = cases[times[count].getDate() - 1].value
          }
        }
      }
    }


  });


}



var update = function (data, contains, time, chart) {

  const nodes = data.nodes.filter(d => contains(d, time));
  // const nodes = data.nodes
  const links = data.links.filter(d => contains(d, time));
  chart.update({ nodes, links });
}

var data;
//define dimensions for svg
var width = 945,
  height = 500;

var svg = d3.select("#simulation").append('svg').attr("width", width)
  .attr("height", height)
  .append("g")

var color = d3.scaleOrdinal(d3.schemeAccent);


function visualization(d) {
  data = d
  chart = create_viz();
  count = 0;
  paused_count = 0;
  contains = ({ start, end }, time) => start <= time && time < end
  contains_nodes = function ({ start, end }, time) {
    return start <= time && time < new Date(year = 2020, month = start.getMonth(), date = start.getDate() + 1, hours = start.getHours())
  }

  times = d3.scaleTime()
    .domain([d3.min(data.nodes, d => d.start), d3.max(data.nodes, d => d.end)])
    .ticks(1000)
    .filter(time => data.nodes.some(d => contains(d, time)))

  d3.select('#simulation').selectAll('circle').remove();
  d3.select('#simulation').selectAll('line').remove();

  loader = document.getElementById('loader')
  loader.style.display = 'none';

  sim = document.getElementById('simulation')
  sim.style.display = 'block';

  var play_pause = document.getElementById('play_pause');
  play_pause.disabled = false

  button_group.min = 0
  button_group.max = times.length - 1
  button_group.value = 0
  play()


}

async function run_simulation(time = null) {
  if (time) {
    paused_count = time
    dates_range.innerHTML = times[time]
    button_group.value = time
    update(data, contains, times[time], chart)

    //draw heatmap
    draw_heatmap(times[time])
    chart_date = times[time].getDate();
    tem_address_bar = "/daily_".concat(chart_date.toString()) + ".csv";
    tem_address_line = "/daily_cum_".concat(chart_date.toString()) + ".csv";
    file_name_bar = path + tem_address_bar;
    file_name_line = path + tem_address_line;
    draw_bar_chart(file_name_bar);
    draw_line_chart(file_name_line);
    
    prev_chart_date = chart_date;
    //console.log(file_name_bar);
    //console.log(file_name_line);
    //console.log(times[time])
  }
}

async function play() {
  paused = false
  while (count < times.length) {
    //set delay so that user can actually view changes
    await delay(play_speed);

    //update graph
    if (count == times.length) {
      update(data, contains, times[paused_count], chart)
    } else {
      update(data, contains, times[count], chart)
    }


    //update date range
    if (count == times.length) {
      dates_range.innerHTML = times[paused_count]
      button_group.value = paused_count
    } else {
      dates_range.innerHTML = times[count]
      button_group.value = count
    }


    //draw heatmap
    if (count == times.length) {
      draw_heatmap(times[paused_count])
    } else {
      draw_heatmap(times[count])
    }

    //console.log(times[count].getDate());
    if (count == times.length) {
      chart_date = times[paused_count].getDate();
    } else {
      chart_date = times[count].getDate();
    }
    tem_address_bar = "/daily_".concat(chart_date.toString()) + ".csv";
    tem_address_line = "/daily_cum_".concat(chart_date.toString()) + ".csv";
    file_name_bar = path + tem_address_bar;
    file_name_line = path + tem_address_line;
   
    if (chart_date != prev_chart_date) {
      remove_charts();
      draw_bar_chart(file_name_bar);
      draw_line_chart(file_name_line);
    };
    prev_chart_date = chart_date;
    //console.log(file_name_bar);
    //console.log(file_name_line);
    //console.log(times[count])
    count = count + 1
  }
}

async function stop() {
  paused = true
  paused_count = count
  count = times.length
  await delay(300);
  console.log(paused_count)
  run_simulation(paused_count)
}

async function restart() {

  if (paused_count !== count && paused_count < times.length) {
    count = parseInt(paused_count);
  }
  paused = false;

  while (count < times.length) {
    //set delay so that user can actually view changes
    await delay(play_speed);

    //update graph
    //update graph
    if (count == times.length) {
      update(data, contains, times[count - 1], chart)
    } else {
      update(data, contains, times[count], chart)
    }

    //update date range
    if (count == times.length) {
      dates_range.innerHTML = times[count - 1]
      button_group.value = count - 1
    } else {
      dates_range.innerHTML = times[count]
      button_group.value = count
    }

    //draw heatmap
    if (count == times.length) {
      draw_heatmap(times[paused_count])
    } else {
      draw_heatmap(times[count])
    }

    if (count == times.length) {
      chart_date = times[count - 1].getDate();
    } else {
      chart_date = times[count].getDate();
    }

    tem_address_bar = "/daily_".concat(chart_date.toString()) + ".csv";
    tem_address_line = "/daily_cum_".concat(chart_date.toString()) + ".csv";
    file_name_bar = path + tem_address_bar;
    file_name_line = path + tem_address_line;
    
    if (chart_date != prev_chart_date) {
      remove_charts();
      draw_bar_chart(file_name_bar);
      draw_line_chart(file_name_line);
    };
    prev_chart_date = chart_date;

    count = count + 1

  }
}


//TODO: 1) add onclick listener for the dates dropdown [use the onclick to run/pause the simulation]
// 2) add form submission for the test features (do this in the main.js file??) 3) create heatmap and div for small charts with popups 