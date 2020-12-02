
//create onclick function on the visualization so that a user can view a larger version of the visualization in a modal
var heatmap = document.getElementById('heatmap')
heatmap.onclick = function(){

    //addcode to div
    heatmap_modal()
    //show modal
    $('.fullscreen.modal').modal({
      onHide:function(){
      }
    })
  .modal('show');
}

var heatmap_data, currtime, heatmap_modal_svg;
var cleaneddata_modal;

var modal_triggered = false;

// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 30},
  heatmap_width = 350 - margin.left - margin.right,
  heatmap_height = 350 - margin.top - margin.bottom;

// append the heatmap_svg object to the body of the page
var heatmap_svg = d3.select("#heatmap")
.append("svg")
  .attr("width", heatmap_width + margin.left + margin.right)
  .attr("height", heatmap_height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Labels of row and columns
var myGroups = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
var myVars = ['12am','1am', '2am', '3am', '4am', '5am','6am', '7am', '8am', '9am', '10am', '11am','12pm','1pm', '2pm', '3pm', '4pm', '5pm','6pm', '7pm', '8pm', '9pm', '10pm', '11pm' ]

// Build X scales and axis:
var x = d3.scaleBand()
  .range([ 0, heatmap_width ])
  .domain(myGroups)
  .padding(0.01);


// Build X scales and axis:
var y = d3.scaleBand()
  .range([ heatmap_height, 0 ])
  .domain(myVars)
  .padding(0.01);


// Build color scale
var myColor = d3.scaleLinear()
  .range(["white", "#C43A3A"])

// create a tooltip
var tooltip = d3.select("#heatmap")
.append("div")
.style("opacity", 0)
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")


//Read the data
d3.csv("heatmap.csv").then(function(d) {
  heatmap_data = cleandata(d)

  //draw x axis
  heatmap_svg.append("g")
  .attr("transform", "translate(0," + heatmap_height + ")")
  .call(d3.axisBottom(x))


  //draw yaxis
  heatmap_svg.append("g")
  .call(d3.axisLeft(y));
});

function draw_heatmap(timeperiod){
  //given the time period, update the current view for this visualization
  currtime = timeperiod;
  var d = cleandata(heatmap_data, timeperiod)
  update_heatmap(d)
}


function heatmap_modal(){
  //updates the visualization for the heatmap that shows up in the modal
      // set the dimensions and margins of the graph
      var margin = {top: 30, right: 30, bottom: 30, left: 30},
        heatmap_width = 950 - margin.left - margin.right,
        heatmap_height = 950 - margin.top - margin.bottom;

     
      d3.select('#open_image').selectAll('*').remove(); //remove previous content of div first
      
      // append the heatmap_svg object to the body of the page
      heatmap_modal_svg = d3.select("#open_image")
      .append("svg")
        .attr("width", heatmap_width + margin.left + margin.right)
        .attr("height", heatmap_height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

      // Labels of row and columns
      var myGroups = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      var myVars = ['12am','1am', '2am', '3am', '4am', '5am','6am', '7am', '8am', '9am', '10am', '11am','12pm','1pm', '2pm', '3pm', '4pm', '5pm','6pm', '7pm', '8pm', '9pm', '10pm', '11pm' ]

      // Build X scales and axis:
      var x = d3.scaleBand()
        .range([ 0, heatmap_width ])
        .domain(myGroups)
        .padding(0.01);


      // Build X scales and axis:
      var y = d3.scaleBand()
        .range([ heatmap_height, 0 ])
        .domain(myVars)
        .padding(0.01);


      // Build color scale
      var myColor = d3.scaleLinear()
        .range(["white", "#C43A3A"])

      // create a tooltip
      var tooltip = d3.select("#open_image")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")

      //Read the data
    d3.csv("heatmap.csv").then(function(d) {  
      cleaneddata_modal = cleandata(d)
      cleaneddata_modal = cleandata(cleaneddata_modal, currtime)
      
      myColor.domain([0, d3.max(cleaneddata_modal, function(d){
        return d.Value
      })]);
      //draw x axis
      heatmap_modal_svg.append("g")
      .attr("transform", "translate(0," + heatmap_height + ")")
      .call(d3.axisBottom(x))


      //draw yaxis
      heatmap_modal_svg.append("g")
      .call(d3.axisLeft(y));

      
      var viz = heatmap_modal_svg.selectAll('rect')
      .data(cleaneddata_modal)

      //remove unneded nodes
      viz.exit().remove();
      
      //create new rects
      viz.enter()
      .append("rect")
        .attr("x", function(d) { 
          return x(getDay(d.Day.getDay())) 
        })
        .attr("y", function(d) {
          return y(getHour(parseInt(d.Hour))) 
        })
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) { return myColor(d.Value)} )
      .on("mouseover", function(d){
        var value = d3.select(this).data()[0]['Value']
        tooltip.style("opacity", 1)
      tooltip
        .html("Infected Persons: " + value)
        .style("left", (d.pageX+70) + "px")
        .style("top", (d.pageY) + "px")
      })
      .on("mouseleave", function(d){
        tooltip.style('opacity',0)
      })
  });
}

function update_heatmap(data){
  //updates the main heatmap in the supplementary visualizations section
  myColor.domain([0, d3.max(data, function(d){
    return d.Value
  })]);

  // add the squares
  // console.log('adding squares', data)
  var viz = heatmap_svg.selectAll('rect')
    .data(data)
  
    //remove unneded nodes
    viz.exit().remove();
    
    //create new rects
    viz.enter()
    .append("rect")
      .attr("x", function(d) { 
        return x(getDay(d.Day.getDay())) 
      })
      .attr("y", function(d) {
        return y(getHour(parseInt(d.Hour))) 
      })
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.Value)} )
    .on("mouseover", function(d){
      var value = d3.select(this).data()[0]['Value']
      tooltip.style("opacity", 1)
    tooltip
      .html("Infected Persons: " + value)
      .style("left", (d.pageX+70) + "px")
      .style("top", (d.pageY) + "px")
    })
    .on("mouseleave", function(d){
      tooltip.style('opacity',0)
    })

}

function getHour(d){
  //returns the hour as a string
  if(d===1){
    return '1am'
  }
  if(d===2){
    return '2am'
  }
  if(d===3){
    return '3am'
  }
  if(d===4){
    return '4am'
  }
  if(d===5){
    return '5am'
  }
  if(d===6){
    return '6am'
  }
  if(d===7){
    return '7am'
  }
  if(d===8){
    return '8am'
  }
  if(d===9){
    return '9am'
  }
  if(d===10){
    return '10am'
  }
  if(d===11){
    return '11am'
  }
  if(d===12){
    return '12pm'
  }
  if(d===13){
    return '1pm'
  }
  if(d===14){
    return '2pm'
  }
  if(d===15){
    return '3pm'
  }
  if(d===16){
    return '4pm'
  }
  if(d===17){
    return '17pm'
  }
  if(d===18){
    return '6pm'
  }
  if(d===19){
    return '7m'
  }
  if(d===20){
    return '8pm'
  }
  if(d===21){
    return '9pm'
  }
  if(d===22){
    return '10pm'
  }
  if(d===23){
    return '11pm'
  }
  if(d===0){
    return '12am'
  }
  
}

function getDay(d){
  //returns the day as a string
  if(d===1){
    return 'Mon'
  }
  if(d===2){
    return 'Tue'
  }
  if(d===3){
    return 'Wed'
  }
  if(d===4){
    return 'Thu'
  }
  if(d===5){
    return 'Fri'
  }
  if(d===6){
    return 'Sat'
  }
  if(d===0){
    return 'Sun'
  }
}

function cleandata(data, timeperiod=null){
  //used to clean the data into the appropriate format for visualization
  var cleaned =[]
  if(timeperiod){
    //if timeperiod is specified, then only select the data that is either before or on the date passed in
    data.forEach(element => {
      if(element.Day<=timeperiod){
        cleaned.push(
          element
        )
      }
    });
  }else{
    //if no time period is specified, then this is the first time coming across data so change day to actual date object and then return
    data.forEach(element => {
      var fdate = new Date(year=2020, month=00, date=element.Day)
      cleaned.push(
        {...element,
          Day: fdate
        }
      )
    });
  }
 
  return cleaned
}


