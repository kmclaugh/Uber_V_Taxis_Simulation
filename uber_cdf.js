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
            var uber_cdf_data = generate_data();//update data
            
            //redraw cdf line
            var svg = d3.select('#graph').transition();
            svg.select('.line')
                .duration(750)
                .attr("d", uber_cdf_line_function(uber_cdf_data));
        });
        
        //create initial cdf data
        var uber_cdf_data = generate_data();
        //draw the cdf graph
        uber_cdf_line_function = draw_uber_cdf_graph(uber_cdf_data);
        
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

function draw_uber_cdf_graph(the_data){
    /*draws the uber cdf graph based on the given cdf data*/
    
    //Set margins and width
    var margin = {
        top: 30,
        right: 0,
        bottom: 35,
        left: 50
    };
    var width = 500 - margin.right - margin.left;
    var height = 250 - margin.top - margin.bottom;
    
    //Add svg element to graph div
    var svg = d3.select('#graph')
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");
    
    //Add the graph title
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", (0 - margin.top/2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text("Uber Driver Incentive Curve");
        
    var xRange = d3.scale.linear()
        .range([0, width])
        .domain([1, max_cdf_surge]);
      
    var yRange = d3.scale.linear()
        .range([height, 0])
        .domain([0, 100]);
    
    var xAxis = d3.svg.axis()
        .scale(xRange)
        .tickSize(5)
        .tickSubdivide(true);
      
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
    
    svg.append("text")//label for the x axis
        .attr("x", width / 2 )
        .attr("y",  height+margin.bottom-5)
        .style("text-anchor", "middle")
        .text("Surge");
    
    //Add the y-axis
    svg.append('svg:g')
        .attr('class', 'y axis')
        .call(yAxis)
    svg.append("text")//label for the y axis
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total Number of Drivers");
    
    //create the uber cdf line function based on the ranges
    var uber_cdf_line_function = d3.svg.line()
        .x(function(d) {
            return xRange(d.x);
        })
        .y(function(d) {
            return yRange(d.y);
        })
        .interpolate('basis');
    
    //Add the path (line) to the svg element based on the cdf line function
    svg.append('svg:path')
        .attr('d', uber_cdf_line_function(the_data))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('class', 'line');
    
    return uber_cdf_line_function;
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