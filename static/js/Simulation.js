
function create_viz(){
    // var day1 = data[0]
    // console.log(day1)
    const simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink().id(d => d.id))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", ticked)
    .force("center", d3.forceCenter(width / 2, height / 2));

    let link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 5)
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
    return Object.assign(svg.node(), {
        update({nodes, links}) {
            setTimeout(function(){
                // Make a shallow copy to protect against mutation, while
                // recycling old nodes to preserve position and velocity.
                const old = new Map(node.data().map(d => [d.id, d]));
                nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
                links = links.map(d => Object.assign({}, d));

                node = node
                  .data(nodes, d => d.id)
                  .join(enter => enter.append("circle")
                    .attr("r", 10)
                    .style('fill', function(d){
                      if(d.infected){
                        return 'red'
                      }
                      return "green"
                    })
                  //   .call(drag(simulation))
                    .call(node => node.append("title").text(d => d.id)));
          
                link = link
                  .data(links, d => [d.source, d.target])
                  .join("line");
          
                simulation.nodes(nodes);
                simulation.force("link").links(links);
                simulation.alpha(1).restart().tick();
                ticked(); // render now!
            }, 1000);
         
        }
    });
}

var update = function(data, contains, time, chart){
    const nodes = data.nodes.filter(d => contains(d, time));
    const links = data.links.filter(d => contains(d, time));
    chart.update({nodes, links});
}

//define dimensions for svg
var width = 887,
height = 500;

var svg = d3.select("#simulation").append('svg').attr("width", width)
.attr("height", height)
.append("g")

var color = d3.scaleOrdinal(d3.schemeAccent);


//fetch data from backend
fetch('/create_dataset', {
    method:'GET',
    headers: new Headers({
        'content-type': 'application/json'
    })
})
.then(function(response){
    if(response.ok){
        response.json().then(function(data){
            

            //clean up data, make dates date objects
            for(let v in data){
                data[v].forEach(element => {
                    element['start'] = new Date(element['start'])
                    element['end'] = new Date(element['end'])
                });
            }
                    
             visualization(data)
        })
    }
    else{
        console.log('unable to fetch data')
        return
    }
})
.catch(function(error){
    console.log('fetch error', error);
});


function visualization(data){
    const chart = create_viz();

    const contains = ({start, end}, time) => start <= time && time < end

    const times = d3.scaleTime()
    .domain([d3.min(data.nodes, d => d.start), d3.max(data.nodes, d => d.end)])
    .ticks(1000)
    .filter(time => data.nodes.some(d => contains(d, time)))
    
    var loader = document.getElementById('loader')
    loader.style.display = 'none';

    var sim = document.getElementById('simulation')
    sim.style.display = 'block';

    var button_group = document.getElementById('day_buttons')

    var count =0
    while(count<times.length){
      update(data, contains, times[count], chart)
      count = count+1

      //add buttons according to days
      var button = document.createElement('option')
      // button.className='ui button'
      button.value =times[count]
      button.textContent = times[count]
      button_group.appendChild(button)
    }
      
}



