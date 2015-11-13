$(window).load(function () {
    
    $(document).ready(function () {
        
        $('#mean').change(function(){
            var number_of_drivers = 500;
            var mean = Number($('#mean').val());
            var standard_dev = Number($('#standard_dev').val());
            var uber_cdf_data = [];
            var uber_list = [];
            
            var previous_surge = 0;
            for (surge=0; surge<500; surge++){
                var percent_of_drivers = cdf(x=surge, mean=mean, variance=Math.pow(standard_dev, 2));
                var total_for_surge = Math.ceil(number_of_drivers * percent_of_drivers);
                var this_surge = total_for_surge - previous_surge;
                var uber_cdf_datum = {'x':surge, 'y':percent_of_drivers};
                previous_surge = total_for_surge;
                uber_cdf_data.push(uber_cdf_datum);
                uber_list.push({'surge':surge, 'driver':this_surge});
            }
            
            // Scale the range of the data again 
            var xRange = d3.scale.linear()
                .range([MARGINS.left, WIDTH - MARGINS.right])
                .domain([d3.min(uber_cdf_data, function(d) {return d.x;}), d3.max(uber_cdf_data, function(d) {return d.x;})]);
              
            var yRange = d3.scale.linear()
                .range([HEIGHT - MARGINS.top, MARGINS.bottom])
                .domain([d3.min(uber_cdf_data, function(d) {return d.y;}), d3.max(uber_cdf_data, function(d) {return d.y;})]);
            
            // Select the section we want to apply our changes to
            var svg = d3.select('#graph').transition();
            console.log('here');
            // Make the changes
            svg.select(".line")   // change the line
                .duration(750)
                .attr("d", lineFunc(uber_cdf_data));
            svg.select(".x.axis") // change the x axis
                .duration(750)
                .call(xAxis);
            svg.select(".y.axis") // change the y axis
                .duration(750)
                .call(yAxis);

        });
        
        var number_of_drivers = 500;
        var mean = Number($('#mean').val());
        var standard_dev = Number($('#standard_dev').val());
        var uber_cdf_data = [];
        var uber_list = [];
        
        var previous_surge = 0;
        for (surge=0; surge<500; surge++){
            var percent_of_drivers = cdf(x=surge, mean=mean, variance=Math.pow(standard_dev, 2));
            var total_for_surge = Math.ceil(number_of_drivers * percent_of_drivers);
            var this_surge = total_for_surge - previous_surge;
            var uber_cdf_datum = {'x':surge, 'y':percent_of_drivers};
            previous_surge = total_for_surge;
            uber_cdf_data.push(uber_cdf_datum);
            uber_list.push({'surge':surge, 'driver':this_surge});
        }
        
        var vis = d3.select('#graph'),
                WIDTH = 1000,
                HEIGHT = 500,
                MARGINS = {
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 50
                };
                
        var xRange = d3.scale.linear()
            .range([MARGINS.left, WIDTH - MARGINS.right])
            .domain([d3.min(uber_cdf_data, function(d) {return d.x;}), d3.max(uber_cdf_data, function(d) {return d.x;})]);
          
        var yRange = d3.scale.linear()
            .range([HEIGHT - MARGINS.top, MARGINS.bottom])
            .domain([d3.min(uber_cdf_data, function(d) {return d.y;}), d3.max(uber_cdf_data, function(d) {return d.y;})]);
        
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
                .style("text-anchor", "end")
                .text("Frequency");
        
      
        var lineFunc = d3.svg.line()
            .x(function(d) {
              return xRange(d.x);
            })
            .y(function(d) {
              return yRange(d.y);
            })
            .interpolate('basis');
        
        vis.append('svg:path')
            .attr('d', lineFunc(uber_cdf_data))
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('fill', 'none');
    });
});


function cdf(x, mean, variance) {
    return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))));
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