//CDF globals
var max_cdf_surge = 5;
var max_cdf_standard_dev = 2.5;
var number_of_drivers = 100

$(window).load(function () {
    
    $(document).ready(function () {
        
        //Create the mean slider for the uber driver cdf
        $("#mean").slider({
            ticks : [0, 1.5, max_cdf_surge/2, max_cdf_surge],
            scale: 'linear',
            step: .1,
            ticks_snap_bounds: .1,
            value: 1.5
        });
        
        //Create the standard dev slider for the uber cdf
        $('#standard_dev').slider({
            reversed : true,
            ticks : [.1, .3, max_cdf_standard_dev/2, max_cdf_standard_dev],
            scale: 'linear',
            step: .1,
            orientation: "vertical",
            value: .3
        });
        
        //Anytime eith ther mean or standard dev slider changes, regenerate the uber cdf data and update the graph
         $(".cdf_slider").on("slide", function(slideEvt) {
            uber_cdf_data = generate_data();//update data
            //update the cdf graph
            uber_cdf_graph.update(uber_cdf_data);
        });
        
        //create initial cdf data
        var uber_cdf_data = generate_data();
        //draw the cdf graph
        var uber_cdf_graph = new uber_cdf_graph_class(uber_cdf_data, 'uber_cdf_graph');
        uber_cdf_graph.draw();
        
        //When the window resizes, resize the graph
        $( window ).resize(function() {
            uber_cdf_graph.resize();
        });
        
    });
});

function generate_data(){
    /*Generates the uber grid's list of drivers. Determines the surge need for each driver to begin driving based on
     *the mean and standard deviation given by the user in the sliders. Returns a list of x,y data pairs to create the
     *uber cdf graph*/
    
    //Get the mean and standard deviations from the sliders
    var mean = Number($('#mean').slider('getValue'));
    var standard_dev = Number($('#standard_dev').slider('getValue'));
    
    //reset the uber drivers list and uber cdf data
    uber_grid.car_list = [];
    var uber_cdf_data = [];

    //loop through all possible surge values from 1 to the max_cdf_surge in .1 increments and
    //use the standard cdf function to find the number of driver who will driver for each surge
    var previous_surge = 0;
    for (surge=1; surge<max_cdf_surge; surge+=0.1){
        
        //Find the number of drivers for this surge
        var percent_of_drivers = cdf(x=surge, mean=mean, variance=Math.pow(standard_dev, 2));
        var total_for_surge = Math.ceil(number_of_drivers * percent_of_drivers);
        var this_surge = total_for_surge - previous_surge;
        var uber_cdf_datum = {'x':surge, 'y':total_for_surge};
        previous_surge = total_for_surge;
        
        //Create the correct number of drivers for this surge and add the data point to the cdf data
        for (u=0; u<this_surge; u++){
            uber_car = new car_class(type='uber', grid=uber_grid, surge_needed=surge, max_cruising_time=20, current_price=false, driving=false);
            uber_grid.car_list.push(uber_car);
        }
        uber_cdf_data.push(uber_cdf_datum);
    }
    
    return uber_cdf_data;
}

function uber_cdf_graph_class(the_data, graph_container_id){
    /*Class for drawing, resizing and updating the uber cdf graph*/
    
    var self = this;
    self.margin = {};
    self.data = the_data;
    self.graph_container_id = graph_container_id;
    
    self.update = function(the_data){
        /*Updates the graph with the new data*/
        self.data = the_data;
        
        //redraw cdf line
        var svg = d3.select('#'+self.graph_container_id).transition();
        svg.select('.line')
            .duration(750)
            .attr("d", self.uber_cdf_line_function(self.data));
    
    }//end update function
    
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
        self.xRange.range([0, self.width]);
        self.yRange.range([self.height, 0]);
        
        //Resize the axis functions
        self.xAxis.scale(self.xRange);
        self.yAxis.scale(self.yRange);
        
        //Resize the axis
        self.x_axis.attr("transform", "translate(0," + self.height + ")")
            .call(self.xAxis);
        self.y_axis.call(self.yAxis);
        
        //Update label positions
        self.x_axis_label
            .attr("x", self.width / 2 )
            .attr("y",  self.height+self.margin.bottom-5);
        
        //label for the y axis
        self.y_axis_label
            .attr("y", 0 - self.margin.left)
            .attr("x",0 - (self.height / 2));
        
        //Update the line
        self.cdf_path.attr('d', self.uber_cdf_line_function(self.data));
            
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
        
        //Add layer to the svg element
        self.svg_g = self.svg.append("g")
                    .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
        
        /*Range functions*/
        self.xRange = d3.scale.linear()
            .range([0, self.width])
            .domain([1, max_cdf_surge]);
          
        self.yRange = d3.scale.linear()
            .range([self.height, 0])
            .domain([0, 100]);
        
        /*Axis functions*/
        self.xAxis = d3.svg.axis()
            .scale(self.xRange)
            .tickSize(5)
            .tickSubdivide(true);
          
        self.yAxis = d3.svg.axis()
            .scale(self.yRange)
            .tickSize(5)
            .orient('left')
            .tickSubdivide(true);
        
        /*Add axis elements*/
        self.x_axis = self.svg_g.append('svg:g')
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.height + ")");
        self.x_axis.call(self.xAxis);
        
        self.y_axis = self.svg_g.append('g')
            .attr("class", "y axis")
        self.y_axis.call(self.yAxis);
        
        /*Add axis label*/
        //label for the x axis
        self.x_axis_label = self.svg_g.append("text")
            .attr("x", self.width / 2 )
            .attr("y",  self.height+self.margin.bottom-5)
            .style("text-anchor", "middle")
            .text("Surge");
        
        //label for the y axis
        self.y_axis_label = self.svg_g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - self.margin.left)
            .attr("x",0 - (self.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Total Number of Drivers");
        
        /*Create the line function.*/
        self.uber_cdf_line_function = d3.svg.line()
            .x(function(d) {return self.xRange(d.x);})
            .y(function(d) {return self.yRange(d.y);})
            .interpolate('basis');
        
        /*Create the path*/
         self.cdf_path = self.svg_g.append('svg:path')
            .attr('d', self.uber_cdf_line_function(self.data))
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('class', 'line');
            
    }//end draw function
    
    /* Reusable functions********************/
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

}

function cdf(x, mean, variance) {
    /*Returns the cumulative distribution value for the given x, mean and variance.
    Copied from http://stackoverflow.com/questions/14846767/std-normal-cdf-normal-cdf-or-error-function*/
    return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))));
}
  
function erf(x) {
    /*Standard error function for a given x
    Copied from http://stackoverflow.com/questions/14846767/std-normal-cdf-normal-cdf-or-error-function*/
    // save the sign of x
    var sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);
  
    // constants
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var p  =  0.3275911;
  
    // A&S formula 7.1.26
    var t = 1.0/(1.0 + p*x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y; // erf(-x) = -erf(x);
}