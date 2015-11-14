var max_cdf_surge = 30;
var max_cdf_standard_dev = Math.round(max_cdf_surge/5);
var number_of_drivers = 100

$(window).load(function () {
    
    $(document).ready(function () {
        
        $("#mean").slider({
            ticks : [0, max_cdf_surge/2, max_cdf_surge],
            scale: 'linear',
            step: 1,
            ticks_snap_bounds: 1,
            value: max_cdf_surge/2
        });
        
        $('#standard_dev').slider({
            reversed : true,
            ticks : [1, max_cdf_standard_dev/2, max_cdf_standard_dev],
            scale: 'linear',
            step: 1,
            ticks_snap_bounds: 1,
            orientation: "vertical",
            value: max_cdf_standard_dev/2
        });
        
         $(".cdf_slider").on("slide", function(slideEvt) {
            
            var uber_cdf_data = generate_data();  
            var vis = d3.select('#graph').transition();
            vis.select('.line')
                .duration(750)
                .attr("d", lineFunc(uber_cdf_data));

        });
        
        var uber_cdf_data = generate_data();
        
        var lineFunc = draw_graph(uber_cdf_data);
        
    });
});

function generate_data(){
    var mean = Number($('#mean').slider('getValue'));
    var standard_dev = Number($('#standard_dev').slider('getValue'));
    var uber_cdf_data = [];
    
    uber_list = [];
    
    var previous_surge = 0;
    for (surge=0; surge<max_cdf_surge; surge++){
        var percent_of_drivers = cdf(x=surge, mean=mean, variance=Math.pow(standard_dev, 2));
        var total_for_surge = Math.ceil(number_of_drivers * percent_of_drivers);
        var this_surge = total_for_surge - previous_surge;
        var uber_cdf_datum = {'x':surge, 'y':total_for_surge};
        
        previous_surge = total_for_surge;
        uber_cdf_data.push(uber_cdf_datum);
        
        for (u=0; u<this_surge; u++){
            uber_car = new car_class(type='uber', grid=the_grid, surge_needed=surge, max_cruising_time=10, current_price=false, driving=false);
            uber_list.push(uber_car);
        }
    }
    
    return uber_cdf_data;
}

function draw_graph(the_data){
    
    var vis = d3.select('#graph'),
                WIDTH = 500,
                HEIGHT = 250,
                MARGINS = {
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 50
                };
                
    var xRange = d3.scale.linear()
        .range([MARGINS.left, WIDTH - MARGINS.right])
        .domain([d3.min(the_data, function(d) {return d.x;}), d3.max(the_data, function(d) {return d.x;})]);
      
    var yRange = d3.scale.linear()
        .range([HEIGHT - MARGINS.top, MARGINS.bottom])
        .domain([d3.min(the_data, function(d) {return d.y;}), d3.max(the_data, function(d) {return d.y;})]);
    
    var xAxis = d3.svg.axis()
        .scale(xRange)
        .tickSize(5)
        .tickSubdivide(true);
      
    var yAxis = d3.svg.axis()
        .scale(yRange)
        .tickSize(5)
        .orient('left')
        .tickSubdivide(true);
  
    vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
        .call(xAxis);
    
    vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
        .call(yAxis)
        .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");
    
  
    var lineFunc = d3.svg.line()
        .x(function(d) {
          return xRange(d.x);
        })
        .y(function(d) {
          return yRange(d.y);
        })
        .interpolate('basis');
    
    vis.append('svg:path')
        .attr('d', lineFunc(the_data))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('class', 'line');
    
    return lineFunc;
}

function cdf(x, mean, variance) {
    return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))));
}

function pdf(x, mean, variance) {
    var exponent = -1 * Math.pow(x-mean, 2)/(2*Math.pow(variance,2));
    
    var pdf = 1/(variance*Math.sqrt(2*Math.PI)) * Math.pow(Math.E, exponent);
    return pdf;
}
  
function erf(x) {
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