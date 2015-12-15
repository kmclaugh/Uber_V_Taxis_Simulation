//Global variables for the output graph
//Store the line_functions here so they can be updated later
var xRangeDemand;
var y0RangeDemand;
var y1RangeDemand;
var demand_line_function;
var surge_line_function;
var demand_path;
var driver_path;
var surge_path;

$(window).load(function () {
    
    $(document).ready(function () {
        //Draw the output graph
        draw_output_graph(uber_grid, taxi_grid, false, true);
    });
});

function update_output_graph(uber_grid, taxi_grid){
    /*Creates the next data points for the passenger, surge, and driver data and updates the graph*/
    
    //copy the current simulation to a new variable so it won't update
    var current_sim_time = new Date(simulation_time);
    
    //Update the uber passenger, driver, and surge data
    var new_demand_data = {x:current_sim_time, y:uber_grid.passengers_list.length};
    uber_grid.demand_data.push(new_demand_data);
    var new_driver_data = {x:current_sim_time, y :uber_grid.current_total_cars};
    uber_grid.driver_data.push(new_driver_data);
    var new_surge_data = {x:current_sim_time, y:uber_grid.current_surge};
    uber_grid.surge_data.push(new_surge_data);
    
    //Update the taxi passenger data
    var new_demand_data = {x:current_sim_time, y:taxi_grid.passengers_list.length};
    taxi_grid.demand_data.push(new_demand_data);
    
    //Select the svg element and redraw the graph
    var svg = d3.select('#uber_output_graph_svg_g');
    draw_output_graph(uber_grid, taxi_grid, svg, false);
        
}

function draw_output_graph(uber_grid, taxi_grid, svg, create){
   /*Creates or updates a graph with the number of taxi and uber ride requests
    *and the number of uber drivers and the uber surge pricing*/
   
   //Graph dimensions data
   var margin = {
        top: 30,
        right: 50,
        bottom: 35,
        left: 50
    };
    var width = 500 - margin.right - margin.left;
    var height = 250 - margin.top - margin.bottom;
    
    
    //If we are creating the graph for the first time, generate the range and line functions and add the axis
    if (create == true){
        
        //Create the svg element
        svg = d3.select('#uber_output_graph')
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr('id', 'uber_output_graph_svg')
                .append("g")
                    .attr("transform", 
                          "translate(" + margin.left + "," + margin.top + ")")
                    .attr('id', 'uber_output_graph_svg_g');
        
        //x-range and domain are from the simulation start time time to the simulation end time
        xRangeDemand = d3.time.scale()
            .range([0, width])
            .domain([simulation_start_time, simulation_end_time]);
        
        //y0 is the uber cars and demand y-axis
        y0RangeDemand = d3.scale.linear()
            .range([height, 0])
            .domain([0, 100]);
        //y1 is the surge y-axis
        y1RangeDemand = d3.scale.linear()
            .range([height, 0])
            .domain([0, 10]);

        var xAxis = d3.svg.axis()
            .scale(xRangeDemand)
            .ticks(6);
          
        var yAxisLeft = d3.svg.axis()
            .scale(y0RangeDemand)
            .tickSize(5)
            .orient('left')
            .tickSubdivide(true);
        
        var yAxisRight = d3.svg.axis()
            .scale(y1RangeDemand)
            .tickSize(5)
            .orient('right')
            .tickSubdivide(true);
        
        //add the x-axis
        svg.append('svg:g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);
        svg.append("text")// text label for the x axis
            .attr("x", width / 2 )
            .attr("y",  height+margin.bottom-5)
            .style("text-anchor", "middle")
            .text("Time");
        
        //Add the demand y-axis
        svg.append('svg:g')
            .attr('class', 'y axis')
            .call(yAxisLeft)
        svg.append("text")// text label for the y axis
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ride Requests");
        
        //Add the surge y-axis
        svg.append("g")             
            .attr("class", "y axis")    
            .attr("transform", "translate(" + width + " ,0)")   
            .style("fill", "red")       
            .call(yAxisRight);
            
        //Add a legend to the graph
        dataset = [uber_grid.demand_data, taxi_grid.demand_data, uber_grid.driver_data, uber_grid.surge_data];
        var color_hash = {  0 : ["uber requests", "blue"],
                1 : ['taxi requests', 'orange'],
               2 : ["uber drivers", "black"],
               3 : ["current surge", "red"]
             }
       
        var legend = d3.select('#'+grid.type+'_output_graph_svg').append("g")
            .attr("class", "legend")
            .attr("height", margin.top)
            .attr("width", width)
            .attr('transform', 'translate(0,0)')    
              
            
        legend.selectAll('rect')
            .data(dataset)
            .enter()
            .append("rect")
                .attr("x", function(d, i){
                    var x_pos = width - i*100 - 45;//HACK hardcode
                    return x_pos;
                })
                .attr("y", margin.top/2)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function(d) {
                    var color = color_hash[dataset.indexOf(d)][1];
                    return color;
                })
              
        legend.selectAll('text')
            .data(dataset)
            .enter()
            .append("text")
                .attr("x", function(d, i){
                    var x_pos = width - i*100 - 30;;//HACK hardcode
                    return x_pos;
                })
                .attr("y", margin.top/2+9)
                .text(function(d) {
                  var text = color_hash[dataset.indexOf(d)][0];
                  return text;
                });
        
        //Create the line functions. Note that the line_function variables are global so they can be updated
        demand_line_function = d3.svg.line()
            .x(function(d) {
              return xRangeDemand(d.x);
            })
            .y(function(d) {
              return y0RangeDemand(d.y);
            })
            .interpolate('basis');
    
        surge_line_function = d3.svg.line()
            .x(function(d) {
              return xRangeDemand(d.x);
            })
            .y(function(d) {
              return y1RangeDemand(d.y);
            })
            .interpolate('basis');
        
        var demand_path = svg.append('svg:path')
            .attr('d', demand_line_function(uber_grid.demand_data))
            .attr('id', 'uber_demand_path')
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
            
        var taxi_path = svg.append('svg:path')
            .attr('d', demand_line_function(taxi_grid.demand_data))
            .attr('id', 'taxi_demand_path')
            .attr('stroke', 'orange')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
            
        var driver_path = svg.append('svg:path')
            .attr('d', demand_line_function(uber_grid.driver_data))
            .attr('id', 'uber_driver_path')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
        
        var surge_path = svg.append('svg:path')
            .attr('d', surge_line_function(uber_grid.surge_data))
            .attr('id', 'uber_surge_path')
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
        
    }//end if create
    
    //Use the line functions to add the lines to the svg graph
    d3.select('#uber_demand_path')
        .attr("d", demand_line_function(uber_grid.demand_data));
    d3.select('#taxi_demand_path')
        .attr("d", demand_line_function(taxi_grid.demand_data));
    d3.select('#uber_driver_path')
        .attr("d", demand_line_function(uber_grid.driver_data));
    d3.select('#uber_surge_path')
        .attr("d", surge_line_function(uber_grid.surge_data));
    
}
    