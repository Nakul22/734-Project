
var times, chart, contains, contains_nodes, loader, sim;
var chart_date, prev_chart_date, file_name_bar, file_name_line;
var button_group = document.getElementById('day_buttons')
var dates_range = document.getElementById('dates_range')
var infection_range = document.getElementById('infection_counter')
var infected_nodes = new Set();

var simulation, drag;

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
          .call(drag(simulation))
          .call(node => node.append("title").text(d => d.id)));

      wait()
      svg.selectAll('circle')
        .transition()
        .duration(750)
        .style('fill', function (d) {
          if (d.infected) {
            infected_nodes.add(d.id)
            if (d.tested && d.test_result === undefined) {
              // console.log('tested no result:',d)
              return '#218295'
            } else if (d.test_result && d.test_result === 'positive') {
              // console.log('positive:',d)
              if (d.status === 'PQ') {
                console.log('pq:', d)
                return 'blue'
              } else if (d.status === "FN") {
                // console.log('fn:',d)
                return 'pink'
              }
              return 'green'
            }
            else if (d.test_result && d.test_result !== 'positive') {
              // console.log('not positive:', d)
              if (d.status === "FN") {
                // console.log('negative but FN')
                return 'orange'
              }
              return 'steelblue'
            }
            // console.log('only infected', d)
            return 'red'
          } else if (!d.infected && d.tested) {
            // console.log('tested but not infected', d)
            return 'brown'
          }
          // console.log('clean', d)
          infected_nodes.delete(d.id)
          return "gray"
        })

      link = link
        .data(links, d => [d.source, d.target])
        .join(enter => enter.append("line")
          .attr("stroke", function (d) {
            if (d.masked)
              return '#218295'
            return "#999"
          })
          .style('stroke-dasharray', function (d) {
            if (d.masked)
              return ('3,3')
            return "#999"
          })
        );

      simulation.nodes(nodes);
      simulation.force("link").links(links);
      simulation.alpha(1).restart().tick();
      ticked(); // render now

      //update total cases counter
      infection_range.innerHTML = infected_nodes.size

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


//fetch data from backend
fetch('/create_dataset', {
  method: 'GET',
  headers: new Headers({
    'content-type': 'application/json'
  })
})
  .then(function (response) {
    if (response.ok) {
      response.json().then(function (data) {


        //clean up data, make dates date objects
        for (let v in data) {
          data[v].forEach(element => {
            element['start'] = new Date(element['start'])
            element['end'] = new Date(element['end'])
          });
        }

        visualization(data)
      })
    }
    else {
      console.log('unable to fetch data')
      return
    }
  })
  .catch(function (error) {
    console.log('fetch error', error);
  });


function visualization(d) {
  data = d
  chart = create_viz();

  contains = ({ start, end }, time) => start <= time && time < end
  contains_nodes = function ({ start, end }, time) {
    return start <= time && time < new Date(year = 2020, month = start.getMonth(), date = start.getDate() + 1, hours = start.getHours())
  }

  times = d3.scaleTime()
    .domain([d3.min(data.nodes, d => d.start), d3.max(data.nodes, d => d.end)])
    .ticks(1000)
    .filter(time => data.nodes.some(d => contains(d, time)))

  loader = document.getElementById('loader')
  loader.style.display = 'none';

  sim = document.getElementById('simulation')
  sim.style.display = 'block';

  var play_pause = document.getElementById('play_pause');
  play_pause.disabled = false

  button_group.min = 0
  button_group.max = times.length - 1

  play()


}

async function run_simulation(time = null) {
  if (time) {
    paused_count = time
    dates_range.innerHTML = times[time]
    button_group.value = time
    update(data, contains, times[time], chart)

    //draw heatmap
    draw_heatmap(times[time]);
    chart_date = times[time].getDate();
    tem_address_bar = "daily_dataset/daily_".concat(chart_date.toString());
    tem_address_line = "daily_dataset/daily_cum_".concat(chart_date.toString());
    file_name_bar = tem_address_bar.concat(".csv");
    file_name_line = tem_address_line.concat(".csv");
    draw_bar_chart(file_name_bar);
    draw_line_chart(file_name_line);
    prev_chart_date = chart_date;
    //console.log(file_name_bar);
    //console.log(file_name_line);
    //console.log(times[time])
  }
}

var count = 0
var paused_count = 0

async function play() {
  paused = false
  while (count < times.length) {
    //set delay so that user can actually view changes
    await delay(play_speed);

    //update graph
    update(data, contains, times[count], chart)

    //update date range
    dates_range.innerHTML = times[count]
    button_group.value = count

    //draw heatmap
    draw_heatmap(times[count])
    //console.log(times[count].getDate());
    chart_date = times[count].getDate();
    tem_address_bar = "daily_dataset/daily_".concat(chart_date.toString());
    tem_address_line = "daily_dataset/daily_cum_".concat(chart_date.toString());
    file_name_bar = tem_address_bar.concat(".csv");
    file_name_line = tem_address_line.concat(".csv");
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
    update(data, contains, times[count], chart)

    //update date range
    dates_range.innerHTML = times[count]
    button_group.value = count

    //draw heatmap
    draw_heatmap(times[count])
    chart_date = times[count].getDate();
    tem_address_bar = "daily_dataset/daily_".concat(chart_date.toString());
    tem_address_line = "daily_dataset/daily_cum_".concat(chart_date.toString());
    file_name_bar = tem_address_bar.concat(".csv");
    file_name_line = tem_address_line.concat(".csv");
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