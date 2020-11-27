
//fetch data from backend
console.log('fetching data')
const chart = function(){
    // var day1 = data[0]
    // console.log(day1)
    const simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink().id(d => d.id))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", ticked);

    let link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
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
            
          // Make a shallow copy to protect against mutation, while
          // recycling old nodes to preserve position and velocity.
          const old = new Map(node.data().map(d => [d.id, d]));
          nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
          links = links.map(d => Object.assign({}, d));
    
          node = node
            .data(nodes, d => d.id)
            .join(enter => enter.append("circle")
              .attr("r", 5)
              .call(drag(simulation))
              .call(node => node.append("title").text(d => d.id)));
    
          link = link
            .data(links, d => [d.source, d.target])
            .join("line");
    
          simulation.nodes(nodes);
          simulation.force("link").links(links);
          simulation.alpha(1).restart().tick();
          ticked(); // render now!
        }
    });
}
var update = function(data){
    // const nodes = data[0].nodes.filter(d => contains(d, time));
    // const links = data[0].links.filter(d => contains(d, time));
    chart.update({nodes:day1['nodes'], links:day1['links']});
}

//define dimensions for svg
var width = 700,
height = 500;

var svg = d3.select("#simulation").append('svg').attr("width", width)
.attr("height", height)
.append("g")

var color = d3.scaleOrdinal(d3.schemeAccent);


fetch('/create_dataset', {
    method:'GET',
    headers: new Headers({
        'content-type': 'application/json'
    })
})
.then(function(response){
    if(response.ok){
        response.json().then(function(data){
            // update(data)
            console.log(data)
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






contains = ({start, end}, time) => start <= time && time < end