var output_graph;

$(window).load(function () {
    
    $(document).ready(function () {
        //Draw the output graph
        output_graph = new output_graph_class(uber_grid, taxi_grid, 'uber_output_graph');
        output_graph.draw();
        
        //When the window resizes, resize the graph
        $( window ).resize(function() {
            output_graph.resize();
        });
    });
});

function output_graph_class(uber_grid, taxi_grid, graph_container_id){
    /*Class for drawing, resizing and updating the output graph*/
    
    var self = this;
    self.margin = {};
    self.uber_grid = uber_grid;
    self.taxi_grid = taxi_grid;
    self.graph_container_id = graph_container_id;
    
    self.update = function(){
        /*Updates the graph with the new data*/
        
        //copy the current simulation to a new variable so it won't update
        var current_sim_time = new Date(simulation_time);
        
        //Update the uber passenger, driver, and surge data
        var new_demand_data = {x:current_sim_time, y:self.uber_grid.passengers_list.length};
        self.uber_grid.demand_data.push(new_demand_data);
        var new_driver_data = {x:current_sim_time, y :self.uber_grid.current_total_cars};
        self.uber_grid.driver_data.push(new_driver_data);
        var new_surge_data = {x:current_sim_time, y:self.uber_grid.current_surge};
        self.uber_grid.surge_data.push(new_surge_data);
        
        //Update the taxi passenger data
        var new_demand_data = {x:current_sim_time, y:self.taxi_grid.passengers_list.length};
        self.taxi_grid.demand_data.push(new_demand_data);
        
        //Update the lines
        self.demand_path.attr("d", self.demand_line_function(self.uber_grid.demand_data));
        self.taxi_path.attr("d", self.demand_line_function(self.taxi_grid.demand_data));
        self.driver_path.attr("d", self.demand_line_function(self.uber_grid.driver_data));
        self.surge_path.attr("d", self.surge_line_function(self.uber_grid.surge_data));
    
    }
    
    self.resize = function(){
        /*Resizes the graph due to a window size change*/
        
        //Get the new graph dimensions
        self.set_graph_dimensions();
        
        //Update the svg dimensions
        self.svg
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom);
        self.svg_g
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
        
        //Rescale the range functions to account for the new dimensions
        self.xRangeDemand.range([0, self.width]);
        self.y0RangeDemand.range([self.height, 0]);
        self.y1RangeDemand.range([self.height, 0]);
        
        //Resize the axis functions
        self.xAxis.scale(self.xRangeDemand);
        self.yAxisLeft.scale(self.y0RangeDemand);
        self.yAxisRight.scale(self.y1RangeDemand);
        
        //Resize the axis
        self.x_axis
            .attr("transform", "translate(0," + self.height + ")")
            .call(self.xAxis);
        self.y_axis_left.call(self.yAxisLeft);
        self.y_axis_right
            .attr("transform", "translate(" + self.width+ " ,0)")
        self.y_axis_right.call(self.yAxisRight);
        
        //Update label positions
        self.x_axis_label
            .attr("x", self.width / 2 )
            .attr("y",  self.height+self.margin.bottom-5)
        self.y_axis_left_label
            .attr("y", 0 - self.margin.left)
            .attr("x",0 - (self.height / 2));
        self.y_axis_right_label
            .attr("y", self.width + self.margin.right/2)
            .attr("x",0 - (self.height / 2));
            
        //Update the legend
        self.legend
            .attr("height", self.margin.top)
            .attr("width", self.width)
        
        self.legend.selectAll('rect')
            .attr("x", function(d, i){
                return self.legend_rec_x(d, i);
            })
            .attr("y", function(d, i){
                return self.legend_rec_y(d, i);
            });
        
        self.legend.selectAll('text')
            .attr("x", function(d, i){
                return self.legend_text_x(d, i);
            })
            .attr("y", function(d, i){
                return self.legend_text_y(d, i);
            });
        
        //Update the lines
        self.demand_path.attr("d", self.demand_line_function(self.uber_grid.demand_data));
        self.taxi_path.attr("d", self.demand_line_function(self.taxi_grid.demand_data));
        self.driver_path.attr("d", self.demand_line_function(self.uber_grid.driver_data));
        self.surge_path.attr("d", self.surge_line_function(self.uber_grid.surge_data));
    }//end resize function
    
    self.draw = function(){
        /*Draws the graph according to the size of the graph element*/
        
        //Set the graph dimensions
        self.set_graph_dimensions();
        
        //Create the svg element
        self.svg = d3.select('#'+self.graph_container_id)
            .append("svg")
                .attr("width", self.width + self.margin.left + self.margin.right)
                .attr("height", self.height + self.margin.top + self.margin.bottom)
                .attr('id', 'uber_output_graph_svg')
        
        //Add layer to the svg element
        self.svg_g = self.svg.append("g")
                    .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
                    .attr('id', 'uber_output_graph_svg_g');
        
        /*Range functions*/
        //x-range and domain are from the simulation start time time to the simulation end time
        self.xRangeDemand = d3.time.scale()
            .range([0, self.width])
            .domain([simulation_start_time, simulation_end_time]);
        
        //y0 is the uber cars and demand y-axis
        self.y0RangeDemand = d3.scale.linear()
            .range([self.height, 0])
            .domain([0, 100]);
            
        //y1 is the surge y-axis
        self.y1RangeDemand = d3.scale.linear()
            .range([self.height, 0])
            .domain([0, 10]);
            
        /*Axis functions*/
        self.xAxis = d3.svg.axis()
            .scale(self.xRangeDemand)
            .ticks(6);
          
        self.yAxisLeft = d3.svg.axis()
            .scale(self.y0RangeDemand)
            .tickSize(5)
            .orient('left')
            .tickSubdivide(true);
        
        self.yAxisRight = d3.svg.axis()
            .scale(self.y1RangeDemand)
            .tickSize(5)
            .orient('right')
            .tickSubdivide(true);
        
        /*Add axis elements*/
        //add the x-axis
        self.x_axis = self.svg_g.append('svg:g')
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.height + ")");
        self.x_axis.call(self.xAxis);
        
        //Add the x axis label
        self.x_axis_label = self.svg_g.append("text")
            .attr("x", self.width / 2 )
            .attr("y",  self.height+self.margin.bottom-5)
            .style("text-anchor", "middle")
            .text("Time");
        
        //Add the demand y-axis
        self.y_axis_left = self.svg_g.append('g')
            .attr("class", "y axis")
        self.y_axis_left.call(self.yAxisLeft);
        
         //Add the left y axis label
        self.y_axis_left_label = self.svg_g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - self.margin.left)
            .attr("x",0 - (self.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ride Requests");
            
        //Add the surge y-axis
        self.y_axis_right = self.svg_g.append('g')
            .attr("class", "y axis")    
            .attr("transform", "translate(" + self.width+ " ,0)")   
            .style("fill", "red");
        self.y_axis_right.call(self.yAxisRight);
        
         //Add the right y axis label
        self.y_axis_right_label = self.svg_g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", self.width + self.margin.right/2)
            .attr("x",0 - (self.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("fill", "red")
            .text("Surge");
            
        /*Add a legend to the graph*/
        dataset = [self.uber_grid.demand_data, self.taxi_grid.demand_data, self.uber_grid.driver_data, self.uber_grid.surge_data];
        var color_hash = {  0 : ["uber requests", "#0f0cf3"],
                1 : ['taxi requests', '#bd66ff'],
               2 : ["uber drivers", "#02e7ff"],
               3 : ["current surge", "red"]
             }
        
        self.legend = self.svg.append("g")
            .attr("class", "legend")
            .attr("height", self.margin.top)
            .attr("width", self.width)
            .attr('transform', 'translate(0,0)')    
            
        self.legend.selectAll('rect')
            .data(dataset)
            .enter()
            .append("rect")
                .attr("x", function(d, i){
                    return self.legend_rec_x(d, i);
                })
                .attr("y", function(d, i){
                    return self.legend_rec_y(d, i);
                })
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function(d) {
                    var color = color_hash[dataset.indexOf(d)][1];
                    return color;
                })
        
        self.legend.selectAll('text')
            .data(dataset)
            .enter()
            .append("text")
                .attr("x", function(d, i){
                    return self.legend_text_x(d, i);
                })
                .attr("y", function(d, i){
                    return self.legend_text_y(d, i);
                })
                .text(function(d) {
                  var text = color_hash[dataset.indexOf(d)][0];
                  return text;
                });
        
        /*Create the line functions.*/
        self.demand_line_function = d3.svg.line()
            .x(function(d) {
              return self.xRangeDemand(d.x);
            })
            .y(function(d) {
              return self.y0RangeDemand(d.y);
            })
            .interpolate('basis');
    
        self.surge_line_function = d3.svg.line()
            .x(function(d) {
              return self.xRangeDemand(d.x);
            })
            .y(function(d) {
              return self.y1RangeDemand(d.y);
            })
            .interpolate('basis');
        
        /*Create the paths*/
        self.demand_path = self.svg_g.append('svg:path')
            .attr('d', self.demand_line_function(uber_grid.demand_data))
            .attr('id', 'uber_demand_path')
            .attr('stroke', '#0f0cf3')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
            
        self.taxi_path = self.svg_g.append('svg:path')
            .attr('d', self.demand_line_function(taxi_grid.demand_data))
            .attr('id', 'taxi_demand_path')
            .attr('stroke', '#bd66ff')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
            
        self.driver_path = self.svg_g.append('svg:path')
            .attr('d', self.demand_line_function(uber_grid.driver_data))
            .attr('id', 'uber_driver_path')
            .attr('stroke', '#02e7ff')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
        
        self.surge_path = self.svg_g.append('svg:path')
            .attr('d', self.surge_line_function(uber_grid.surge_data))
            .attr('id', 'uber_surge_path')
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
        
    }//End draw function
    
    /* Reusable functions********************/
    
    self.legend_text_x = function(d, i){
        /*Returns the x position for the text of the legend*/
        if (i < 2){
            var x_pos = self.width - i*110 - 30;//HACK hardcode
        }
        else{
            var x_pos = self.width - (i-2)*110 - 30;//HACK hardcode
        }
        return x_pos;
    }
    self.legend_text_y = function(d, i){
        if (i < 2){
            return 25;
        }
        else{
            return self.margin.top/2+15;
        }
    }
    
    self.legend_rec_x = function(d, i){
        /*Returns the x position for the color rectangle of the legend*/
        if (i < 2){
            var x_pos = self.width - i*110 - 45;//HACK hardcode
        }
        else{
            var x_pos = self.width - (i-2)*110 - 45;//HACK hardcode
        }
        return x_pos;
    }
    self.legend_rec_y = function(d, i){
        /*Returns the y position for the color rectangle of the legend*/
        if (i < 2){
            return 15;
        }
        else{
            return self.margin.top/2+5;
        }
    }
    
    self.set_graph_dimensions = function(){
        /*Resets the higheth width and margins based on the column width*/
        var graph_container_width = $('#'+self.graph_container_id).width();
        var left_margin = function(){
            if (graph_container_width < 400){
                return 45;
            }
            else{
                return 50;
            }
        }
        self.margin = {
            top: 50,
            right: 50,
            bottom: 40,
            left: left_margin()
        };
        self.width = graph_container_width - self.margin.right - self.margin.left;
        if (self.width > 500){
            self.width = 500;
        }
        self.height = 250 - self.margin.top - self.margin.bottom;
    }

}//End output_graph_class

