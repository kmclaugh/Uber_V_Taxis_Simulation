
$(window).load(function () {
    
    $(document).ready(function () {
        
        draw_demand_graph(demand_data, false, true);
        
    });
});

function update_demand_graph(the_data){
    var new_demand = Number($('#demand_slider').slider('getValue'));
    var current_sim_time = new Date(simulation_time);
    var new_data = {x:current_sim_time, y:new_demand};
    
    the_data.push(new_data);
    var svg = d3.select('#demand_graph_svg');
    svg.select('.line').remove();
    draw_demand_graph(the_data, svg, false);
        
}

function draw_demand_graph(the_data, svg, create){
   var margin = {
        top: 30,
        right: 0,
        bottom: 35,
        left: 50
    };
    var width = 500 - margin.right - margin.left;
    var height = 250 - margin.top - margin.bottom;
    
    if (create == true){
        svg = d3.select('#demand_graph')
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", 
                          "translate(" + margin.left + "," + margin.top + ")")
                    .attr('id', 'demand_graph_svg');
    }
    
    var xRange = d3.time.scale()
        .range([0, width])
        .domain([simulation_start_time, simulation_end_time]);
      
    var yRange = d3.scale.linear()
        .range([height, 0])
        .domain([0, 100]);
    
    if (create == true){
        var xAxis = d3.svg.axis()
            .scale(xRange)
            .ticks(6);
          
        var yAxis = d3.svg.axis()
            .scale(yRange)
            .tickSize(5)
            .orient('left')
            .tickSubdivide(true);
      
        //add the x-axis
        svg.append('svg:g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);
        
        svg.append("text")      // text label for the x axis
            .attr("x", width / 2 )
            .attr("y",  height+margin.bottom-5)
            .style("text-anchor", "middle")
            .text("Time");
        
        //Add the y-axis
        svg.append('svg:g')
            .attr('class', 'y axis')
            .call(yAxis)
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ride Requests");
    }
    
  
    var lineFunc = d3.svg.line()
        .x(function(d) {
          return xRange(d.x);
        })
        .y(function(d) {
          return yRange(d.y);
        })
        .interpolate('basis');
    
    svg.append('svg:path')
        .attr('d', lineFunc(the_data))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('class', 'line');
    
    return lineFunc;
}
    