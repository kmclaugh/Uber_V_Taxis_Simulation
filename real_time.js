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
        
        draw_demand_graph(demand_data, driver_data, surge_data, false, true);
        
    });
});

function update_demand_graph(passenger_data, driver_data, surge_data){
    var new_demand = Number($('#demand_slider').slider('getValue'));
    var current_sim_time = new Date(simulation_time);
    var new_passenger_data = {x:current_sim_time, y:new_demand};
    passenger_data.push(new_passenger_data);
    
    var new_driver_data = {x:current_sim_time, y :current_total_ubers};
    driver_data.push(new_driver_data);
    
    var new_surge_data = {x:current_sim_time, y:current_surge};
    surge_data.push(new_surge_data);
    
    var svg = d3.select('#demand_graph_svg_g');
    //svg.select('.line').remove();
    draw_demand_graph(passenger_data, driver_data, surge_data, svg, false);
        
}

function draw_demand_graph(passenger_data, driver_data, surge_data, svg, create){
   var margin = {
        top: 30,
        right: 50,
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
                .attr('id', 'demand_svg')
                .append("g")
                    .attr("transform", 
                          "translate(" + margin.left + "," + margin.top + ")")
                    .attr('id', 'demand_graph_svg_g');
        
        //x-range and domain are time from the start time time to the end time
        xRangeDemand = d3.time.scale()
            .range([0, width])
            .domain([simulation_start_time, simulation_end_time]);
        
        //y0 is the uber cars and demand y-axis
        y0RangeDemand = d3.scale.linear()
            .range([height, 0])
            .domain([0, 100]);
        //y1 is the price y-axis
        y1RangeDemand = d3.scale.linear()
            .range([height, 0])
            .domain([0, 50]);

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
            .tickSubdivide(true)
      
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
        
        //Add the demand y-axis
        svg.append('svg:g')
            .attr('class', 'y axis')
            .call(yAxisLeft)
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ride Requests");
        
        //Add the price y-axis
        svg.append("g")             
            .attr("class", "y axis")    
            .attr("transform", "translate(" + width + " ,0)")   
            .style("fill", "red")       
            .call(yAxisRight);
            
        
        // add legend
        dataset = [passenger_data, driver_data, surge_data];
        var color_hash = {  0 : ["passengers", "blue"],
					    1 : ["uber drivers", "orange"],
					    2 : ["current surge", "red"]
					  }   
        var legend = d3.select('#demand_svg').append("g")
            .attr("class", "legend")
              //.attr("x", w - 65)
              //.attr("y", 50)
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
        
        demand_path = svg.append('svg:path')
            .attr('d', demand_line_function(passenger_data))
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
            
        driver_path = svg.append('svg:path')
            .attr('d', demand_line_function(driver_data))
            .attr('stroke', 'orange')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
        
        surge_path = svg.append('svg:path')
            .attr('d', surge_line_function(surge_data))
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
    }
    
    demand_path
        .attr("d", demand_line_function(passenger_data));
    driver_path
        .attr("d", demand_line_function(driver_data));
    surge_path
        .attr("d", surge_line_function(surge_data));
}
    