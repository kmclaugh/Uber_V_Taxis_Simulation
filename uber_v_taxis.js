//Macros
var real_time_per_step;
var simulation_time_per_step;
var base_uber;
var taxi_price;
var max_surge;

//Globals
var timer;
var simulation_time;
var total_steps;
var uber_grid;
var taxi_grid;
var auto_changing = false;

function reset_global_variables(){
    /*Sets the global vairables and grid stats*/
    //Macros
    real_time_per_step = 100;
    simulation_time_per_step = 30;//seconds
    base_uber = $('#uber_base_price').autoNumeric('get') * (simulation_time_per_step/60);
    max_surge = Number($('#uber_max_surge').val());
    taxi_price = $('#taxi_price').autoNumeric('get') * (simulation_time_per_step/60);
    number_of_taxis = $('#number_of_taxis').val();
    if (number_of_taxis > 100){
        number_of_taxis = 100;
    }
    
    
    //Globals
    total_steps = 0;
    simulation_start_time = new Date(2015, 11, 15, 12, 0);
    simulation_end_time = new Date(2015, 11, 15, 23, 59, 59);
    simulation_time = new Date(simulation_start_time);
    timer = null;
    auto_changing = false;
    //taxi
    taxi_grid.car_list = [];
    taxi_grid.passengers_list = [];
    taxi_grid.current_surge = 1;
    //uber
    uber_grid.car_list = [];
    uber_grid.passengers_list = [];
    uber_grid.current_surge = 1;
    
    
    //Stats
    //uber
    uber_grid.total_rides_started = 0;
    uber_grid.total_rides_completed = 0;
    uber_grid.total_wait_time = 0;
    uber_grid.total_ride_time = 0;
    uber_grid.total_ride_price = 0;
    uber_grid.current_total_wait_time = 0;
    uber_grid.previous_total_weight_time = 0;
    uber_grid.current_demand = 0;
    uber_grid.current_total_cars;
    uber_grid.demand_data = [];
    uber_grid.driver_data = [];
    uber_grid.surge_data = [];
    uber_grid.average_ride_price = 0;
    uber_grid.failed_rides = 0;
    uber_grid.current_failed_rides = 0;
    uber_grid.current_surge = 1;
    //taxi
    taxi_grid.total_rides_started = 0;
    taxi_grid.total_rides_completed = 0;
    taxi_grid.total_wait_time = 0;
    taxi_grid.total_ride_time = 0;
    taxi_grid.total_ride_price = 0;
    taxi_grid.current_total_wait_time = 0;
    taxi_grid.previous_total_weight_time = 0;
    taxi_grid.current_demand = 0;
    taxi_grid.current_total_cars;
    taxi_grid.demand_data = [];
    taxi_grid.driver_data = [];
    taxi_grid.surge_data = [];
    taxi_grid.average_ride_price = 0;
    taxi_grid.failed_rides = 0;
    taxi_grid.current_failed_rides = 0;
    taxi_grid.current_surge = 1;
}

$(window).load(function () {
    
    $(document).ready(function () {
        
        //Creat the Uber grid
        uber_grid = new grid_class(18, 'uber_grid', 'uber');
        uber_grid.create_grid();
        uber_grid.add_headings();
        uber_grid.add_options();
        uber_grid.create_html();
        
        //Create the taxi grid
        taxi_grid = new grid_class(18, 'taxi_grid', 'taxi');
        taxi_grid.create_grid();
        taxi_grid.add_headings();
        taxi_grid.add_options();
        taxi_grid.create_html();
        
        //Set up autoNumerics
        $('#taxi_price').autoNumeric('init', {aForm: true, aSign: "$",vMin: 0.01, vMax: 200});
        $('#uber_base_price').autoNumeric('init', {aForm: true, aSign: "$", vMin: 0.01, vMax: 200});
        
        
        
        //Set global variables and create the taxis
        reset_global_variables();
        create_taxis(number_of_taxis);
        
        
        //Update the uber base price, number of taxis, or taxi price if the inputs change
        //Convert from per minute to per step
        $('#uber_base_price').change(function(){
            base_uber = $('#uber_base_price').autoNumeric('get') * (simulation_time_per_step/60);
        });
        $('#uber_max_surge').change(function(){
            max_surge = Number($('#uber_max_surge').val());
        });
        $('#taxi_price').change(function(){
            taxi_price = $('#taxi_price').autoNumeric('get') * (simulation_time_per_step/60);
        });
        $('#number_of_taxis').change(function(){
            number_of_taxis = Number($('#number_of_taxis').val());
            if (number_of_taxis > 100){
                number_of_taxis = 100;
            }
            create_taxis(number_of_taxis);
        });
        
        //Start the time stepping when the use clicks start
        $("#start").click(function() {
            
            //Disable the uber cdf sliders
            $('#mean').slider('disable');
            $('#standard_dev').slider('disable');
            
            //Set up and start the timer for the time step
            if (timer !== null) return;
            timer = window.setInterval(function(){
                if (simulation_time <= simulation_end_time){
                    time_step();
                }
                else{
                    clearInterval(timer);
                    timer = null;
                }
            }, real_time_per_step);
        });
        
        //Stop the timer if the user clicks stop
        $("#stop").click(function() {
            clearInterval(timer);
            timer = null;
        });
        
        //If the user clicks reset, clear all grids, stats, and graphs. Retain all inputs and uber cdf
        $("#reset").click(function() {
            clearInterval(timer);
            timer = null;
            reset_global_variables();
            update_stats(uber_grid);
            update_stats(taxi_grid);
            uber_grid.reset();
            taxi_grid.reset();
            generate_data();
            create_taxis(number_of_taxis);
            $('#mean').slider('enable');
            $('#standard_dev').slider('enable');
            output_graph.update();
        });
        
        //Initialize the demand slider
        $("#demand_slider").slider({
            reversed : true,
            ticks : [0, 100],
            scale: 'linear',
            step: 1,
            ticks_snap_bounds: 1
        });
        
        //When the demand slider moves, update the number of ride requests
        $("#demand_slider").on("slide", function(slideEvt) {
            uber_grid.current_demand = slideEvt.value;
            taxi_grid.current_demand = slideEvt.value;
            if (auto_changing == false){
                $('#change_demand').attr('checked', false);
            }
        });
    
    });
});

function time_step(){
    /*Function that runs every time step. Cars move, passengers are picked up or dropped off,
     *number of reuqests are increased or decreased, stats and graphs are updated*/
    
    //Auto change demand if it is checked
    if ($('#change_demand').is(':checked')) {
        auto_change_demand();
    }
    
    //Move cars and update ride requests
    uber_grid.time_step_logic();
    taxi_grid.time_step_logic();
    
    //Update stats and graphs
    total_steps += 1;
    simulation_time.setSeconds(simulation_time.getSeconds() + simulation_time_per_step);
    update_stats(uber_grid);
    update_stats(taxi_grid);
    output_graph.update();
}

function auto_change_demand(){
    /*Automatically fluctuates the demand based on some predetermined value*/
    var old_demand = uber_grid.current_demand;
    switch (simulation_time.getTime()){
        case new Date(2015, 11, 15, 12, 20).getTime():
            var new_demand = 5;
            break;
        
        //Staircase demand
        case new Date(2015, 11, 15, 13, 0).getTime():
            var new_demand = 0;
            break;
        case new Date(2015, 11, 15, 13, 30).getTime():
            var new_demand = 10;
            break;
        
        case new Date(2015, 11, 15, 14, 0).getTime():
            var new_demand = 0;
            break;
        case new Date(2015, 11, 15, 14, 30).getTime():
            var new_demand = 20;
            break;
        
        case new Date(2015, 11, 15, 15, 0).getTime():
            var new_demand = 0;
            break;
        case new Date(2015, 11, 15, 15, 30).getTime():
            var new_demand = 30;
            break;
        
        case new Date(2015, 11, 15, 16, 0).getTime():
            var new_demand = 0;
            break;
        case new Date(2015, 11, 15, 16, 30).getTime():
            var new_demand = 40;
            break;
        
        //Drop deman to 1
        case new Date(2015, 11, 15, 17, 0).getTime():
            var new_demand = 0;
            break;
        case new Date(2015, 11, 15, 17, 30).getTime():
            var new_demand = 1;
            break;
        
        //Spike demand for 30 min
        case new Date(2015, 11, 15, 18, 0).getTime():
            var new_demand = 0;
            break;
        case new Date(2015, 11, 15, 18, 30).getTime():
            var new_demand = 100;
            break;
        case new Date(2015, 11, 15, 19, 30).getTime():
            var new_demand = 0;
            break;
        
        default:
            var new_demand = old_demand;
    }
    auto_changing = true;
    $('#demand_slider').slider('setValue', new_demand, true, true);
    auto_changing = false;
    
}

function update_stats(grid){
    /*Updates the statistics at the end of a time step*/
    
    //Calculate averages
    var average_ride_time = grid.total_ride_time/grid.total_rides_completed;
    var average_wait_time = grid.total_wait_time/grid.total_rides_started;
    var average_ride_price = grid.total_ride_price/grid.total_rides_completed;
    var average_driver_salary = grid.total_money/grid.total_driver_time;// $/timestep
    average_driver_salary = average_driver_salary * (1/simulation_time_per_step) * 60 * 60;// $/hour
    var price_per_minute = grid.total_ride_price/grid.total_ride_time * 1/simulation_time_per_step * 60//sec/min
    if (isNaN(price_per_minute)){
        price_per_minute = 0;
    }
    
    //Update html objects with new values
    $('[name="'+grid.type+'_longest_wait_time"]').text(convert_timesteps_to_time(grid.longest_wait_time));
    $('[name="'+grid.type+'_average_wait_time"]').text(convert_timesteps_to_time(average_wait_time));
    $('[name="'+grid.type+'_average_ride_price"]').text('$'+price_per_minute.toFixed(2));
    $('[name="'+grid.type+'_average_driver_salary"]').text('$'+average_driver_salary.toFixed(2));
    $('[name="'+grid.type+'_total_rides_completed"]').text(grid.total_rides_completed);
    
    if (grid.type == 'uber') { 
        $('[name="'+grid.type+'_current_surge"]').text(grid.current_surge);
        $('[name="'+grid.type+'_current_total_ubers"]').text(grid.current_total_cars);
    }
    
    //Format the simulation time for user readability
    var min = simulation_time.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    var hr = simulation_time.getHours();
    if (hr < 12){
        var ampm = 'am';
    }
    else if (hr == 12){
        var ampm = 'pm';
        
    }
    else {
        hr = hr -12;
        var ampm = 'pm';
    }
    var current_time_string = hr + ':' + min + ' ' + ampm;
    $('#current_time').text(current_time_string);
}

function convert_timesteps_to_time(time_steps){
    /*Convert the given number of time steps to hours and minutes based on the sim time per timestep
    and format a string for the user*/
    if (isNaN(time_steps) == false){
        time_steps = Math.floor(time_steps);
    }
    else{
        time_steps = 0;
    }
    var total_seconds = time_steps * simulation_time_per_step;
    var hours   = Math.floor(total_seconds / 3600);
    var minutes = Math.floor((total_seconds - (hours * 3600)) / 60);
    var seconds = total_seconds - (hours * 3600) - (minutes * 60);
    
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}

    var time_string = hours+':'+minutes+':'+seconds;
    return time_string;
}

function grid_class(size, html_id, type){
    /*Class for carrying around grid info including cars and passengers lists. stats, and time stepping logic*/
    var self = this;
    this.size = size;
    this.array = [];
    this.html_id = html_id;
    this.html = '';
    this.type = type;
    //stats
    this.total_rides_started;
    this.total_rides_completed;
    this.total_wait_time;
    this.total_ride_time;
    this.total_ride_price;
    this.current_total_wait_time;
    this.previous_total_weight_time = 0;
    this.current_demand;
    this.current_total_cars;
    this.demand_data = [];
    this.driver_data = [];
    this.surge_data = [];
    this.average_ride_price;
    this.average_ride_time;
    this.average_wait_time;
    this.failed_rides;
    this.current_failed_rides;
    this.car_list = [];
    this.passengers_list = [];
    this.current_surge = 1;
    this.longest_wait_time = 0;
    this.total_driver_time = 0;
    this.total_money = 0;
    
    this.time_step_logic = function(){
        /*runs the time step logic for each car and passenger. If this is the uber grid, it determines the surge logic as well*/
        
        //Time step each car
        this.current_total_cars = 0;
        for (c=0; c<this.car_list.length; c++){
            var car = this.car_list[c];
            
            car.time_step_logic();
            if (car.driving == true){
                this.current_total_cars += 1;
            }
        }
        
        //Update the number of passengers based on the demand logic
        if (this.passengers_list.length < this.current_demand){
            var add_passengers = this.current_demand - this.passengers_list.length;
            this.create_random_passengers(add_passengers);
        }
        
        //Time step each ride request and update the current total wait time
        this.current_total_wait_time = 0;
        for (p=0; p<this.passengers_list.length; p++){
            passenger = this.passengers_list[p];
            passenger.time_step_logic();
        }
        
        //If this is uber, run through the surge logic
        if (this.type == 'uber') {
            
            //If the current total wait time has gone up by more than 100 time steps since the last time step,
            //increase the surge by 0.1 for each 100 time step increase
            if (this.current_total_wait_time > this.previous_total_weight_time + 100){
                var current_total_wait_time_rounded = Math.floor(this.current_total_wait_time / 100) * 100;//round to the nearest 100
                var add_surge = (current_total_wait_time_rounded - this.previous_total_weight_time)/100/10;//increase by 0.1 for each 100 increase
                this.current_surge += add_surge;
                
                //Update previous_total_weight_time
                this.previous_total_weight_time = current_total_wait_time_rounded;
            }
            
            //If the current total wait time is holding or decreasing, decrease the surge
            else if (this.current_total_wait_time <= this.previous_total_weight_time){
                var current_total_wait_time_rounded = Math.floor(this.current_total_wait_time / 100) * 100;//round to the nearest 100
                
                //If the rounded wait time is less than the previous,
                if (current_total_wait_time_rounded < this.previous_total_weight_time) {
                    var minus_surge = (current_total_wait_time_rounded - this.previous_total_weight_time)/100/10;//decrease by 0.1 for each 100 decrease
                }
                //If the rounded wait time is equal to the previous and the surge is still greater than 1, (ie it's holding)
                else if (this.current_surge > 1){
                    var minus_surge = -0.1;//decrease by 0.1
                }
                //If the surge is at 1, do not decrease the surge
                else{
                    var minus_surge = 0;
                }
                
                //Update the surge
                this.current_surge += minus_surge;
                if (this.current_surge < 1){//if it's less than 1, set it to 1
                    this.current_surge = 1;
                }
                
                //Update previous_total_weight_time
                this.previous_total_weight_time = current_total_wait_time_rounded;
            }
            
            if (this.current_surge > max_surge){
                this.current_surge = max_surge;
            }
        }
        
    }
    
    this.create_random_passengers = function(number_of_passengers){
        /*Creates the given number of random passengers*/
        for (counter=0; counter<number_of_passengers; counter++){
            this.create_random_passenger();
        }
    }

    this.create_random_passenger = function(){
        /*Create a passenger and places them randomly on the grid*/
        var random_cell = this.pick_random_cell();
        var passenger = new passenger_class(this);
        passenger.set_on(random_cell[0].x, random_cell[0].y);
        this.passengers_list.push(passenger);
    }
       
    this.create_html = function(){
        /*Create the html table using the html for each cell*/
        table_string = '<table class="simulation_grid '+this.type+'">'
        for (y=0; y<self.array.length; y++){
            table_string = table_string + '<tr>';
            var row = self.array[y];
            for (x=0; x<row.length; x++){
                var cell = row[x];
                table_string = table_string + cell.make_html();
            }
            table_string = table_string + '</tr>';
        }
        table_string = table_string + '</table>';
        self.html = table_string;
        $('#'+self.html_id).html(self.html);
        return self.html;
    }
    
    this.reset = function(){
        /*Clears passengers from cells and resets the styles*/
        for (y=0; y<self.array.length; y++){
            var row = self.array[y];
            for (x=0; x<row.length; x++){
                var cell = row[x];
                cell.passengers = [];
            }
        }
        $('.has_car').each(function(){
            $(this).removeClass('has_car');
        });
        $('.has_passenger').each(function(){
            $(this).removeClass('has_passenger');
        });
    }
    
    this.pick_random_cell = function(){
        /*picks a random, non-obstacle cell and returns the cell and a random heading from that cell*/
        var obstacle = true;
        while (obstacle == true){
            var random_row = getRandomInt(min=0, max=this.size-1);
            var random_column = getRandomInt(min=0, max=this.size-1);
            var random_cell = this.get_cell(random_column, random_row);
            obstacle = random_cell.obstacle;
        }
        var random_heading = random_cell.headings.list[Math.floor(random_cell.headings.list.length * Math.random())];
        return [random_cell, random_heading];
    }
    
    this.add_headings = function(){
        /*Add possible headings to cell*/
        for (y=0; y<self.array.length; y++){
            var row = self.array[y];
            for (x=0; x<row.length; x++){
                var cell = row[x];
                if (cell.x % 4 == 0){
                    cell.headings.south = true;
                }
                else if (cell.x % 4 == 1){
                    cell.headings.north = true;
                }
                if (cell.y % 4 == 0){
                    cell.headings.west = true;
                }
                else if (cell.y % 4 == 1){
                    cell.headings.east = true;
                }
            }
        }
    }
    
    this.add_options = function(){
        /*Add possible options to cell*/
        for (y=0; y<self.array.length; y++){
            var row = self.array[y];
            for (x=0; x<row.length; x++){
                var cell = row[x];
                
                var valid_options = {};
                if (cell.headings.north == true){
                    var heading_options = self.find_valid_options(cell, 'north');
                    valid_options['north'] = heading_options;
                    if (heading_options.length > 0){
                        cell.headings.list.push('north');
                    }
                }
                if (cell.headings.west == true){
                    var heading_options = self.find_valid_options(cell, 'west');
                    valid_options['west'] = heading_options;
                    if (heading_options.length > 0){
                        cell.headings.list.push('west');
                    }
                }
                if (cell.headings.east == true){
                    var heading_options = self.find_valid_options(cell, 'east');
                    valid_options['east'] = heading_options;
                    if (heading_options.length > 0){
                        cell.headings.list.push('east');
                    }
                }
                if (cell.headings.south == true){
                    var heading_options = self.find_valid_options(cell, 'south');
                    valid_options['south'] = heading_options;
                    if (heading_options.length > 0){
                        cell.headings.list.push('south');
                    }
                }
                cell.valid_options = valid_options;
            }
        }
    }
                
    this.find_valid_options = function(cell, current_heading){
        /*Finds the valid left, right, or straight options given the current cell and heading*/
        
        var valid_options = [];
        if (current_heading == 'south'){
            var cell_straight = self.get_cell(cell.x, cell.y+2);
            if (cell_straight != false && cell_straight.headings.south == true){
                valid_options.push('straight');
            }
            var cell_right = self.get_cell(cell.x-1, cell.y);
            if (cell_right != false && cell_right.headings.west == true){
                valid_options.push('right');
            }
            var cell_left = self.get_cell(cell.x+2, cell.y+1);
            if (cell_left != false && cell_left.headings.east == true){
                valid_options.push('left');
            }
        }
        else if (current_heading == 'north'){
            var cell_straight = self.get_cell(cell.x, cell.y-2);
            if (cell_straight != false && cell_straight.headings.north == true){
                valid_options.push('straight');
            }
            var cell_right = self.get_cell(cell.x+1, cell.y);
            if (cell_right != false && cell_right.headings.east == true){
                valid_options.push('right');
            }
            var cell_left = self.get_cell(cell.x-2, cell.y-1);
            if (cell_left != false && cell_left.headings.west == true){
                valid_options.push('left');
            }
        }
        else if (current_heading == 'east'){
            var cell_straight = self.get_cell(cell.x+2, cell.y);
            if (cell_straight != false && cell_straight.headings.east == true){
                valid_options.push('straight');
            }
            var cell_right = self.get_cell(cell.x, cell.y+1);
            if (cell_right != false && cell_right.headings.south == true){
                valid_options.push('right');
            }
            var cell_left = self.get_cell(cell.x+1, cell.y-2);
            if (cell_left != false && cell_left.headings.north == true){
                valid_options.push('left');
            }
        }
        else if (current_heading == 'west'){
            var cell_straight = self.get_cell(cell.x-2, cell.y);
            if (cell_straight != false && cell_straight.headings.west == true){
                valid_options.push('straight');
            }
            var cell_right = self.get_cell(cell.x, cell.y-1);
            if (cell_right != false && cell_right.headings.north == true){
                valid_options.push('right');
            }
            var cell_left = self.get_cell(cell.x-1, cell.y+2);
            if (cell_left != false && cell_left.headings.south == true){
                valid_options.push('left');
            }
        }
        return(valid_options);
    }
    
    this.get_cell = function(x, y){
        /*returns the given cell. returns false if it does not exists*/
        var cell = false;
        if (y >= 0 && y < self.size){
            if (x >= 0 && x < self.size){
                cell = self.array[y][x];
            }
        }
        return cell;
    }

    this.create_grid = function(){
        /*Creates the grid based on the given size*/
        for (y = 0; y < self.size; y++) {
            var row = [];
            for (x = 0; x < self.size; x++) {
                var x_mod = x % 4;
                var y_mod = y % 4;
                if ((x_mod==2 || x_mod==3) && (y_mod==2 || y_mod==3)){
                    var cell = new cell_class(x, y, true, this);
                }
                else{
                    var cell = new cell_class(x, y, false, this);
                }
                row.push(cell);
            }
            self.array.push(row);
        }
        return self.array;
    }
}

function create_taxis(number_of_taxis) {
    /*Creates the given number of taxis and adds them to the taxi grid object*/
    taxi_grid.car_list = [];
    for (t=0; t<number_of_taxis; t++){
        taxi = new car_class(type='taxi', grid=taxi_grid, surge_needed=0, max_cruising_time=0, current_price=taxi_price, driving=false);
        taxi_grid.car_list.push(taxi);
    }
}
    
function passenger_class(grid){
    /*Class for the passenger*/
    this.grid = grid;
    this.current_cell = false;
    this.waiting = true;
    this.destination_travel_time = getRandomInt(min=4, max=100);
    this.start_step = total_steps;
    this.wait_time;
    this.current_wait_time = 0;
    this.will_wait = 30;
    this.current_travel_time = 0;
    
    this.time_step_logic = function(){
        /*Run at each timestep, updates the current wait time*/
        this.current_wait_time += 1;
        this.grid.current_total_wait_time += this.current_wait_time;
    }
    
    this.picked_up = function(){
        /*Logic for being picked up by the car*/
        this.remove_from();//remove from the grid
        this.waiting = false;
        //Update stats
        this.wait_time = total_steps+1 - this.start_step;
        this.grid.total_rides_started += 1;
        this.grid.total_wait_time += this.wait_time;
        if (this.wait_time > this.grid.longest_wait_time) {
            this.grid.longest_wait_time = this.wait_time;
        }
        //Remove from grid's passenger list
        var index = this.grid.passengers_list.indexOf(this);
        this.grid.passengers_list.splice(index, 1);
    }
        
    this.dropped_off = function(current_price){
        /*logic for being dropped off*/
        this.grid.total_ride_time += this.destination_travel_time;
        this.grid.total_rides_completed += 1;
        var ride_price = this.destination_travel_time * current_price
        this.grid.total_ride_price += ride_price;
        return ride_price;
    }
    
    this.set_on = function(x,y){
        /*Places the passenger on the given x, y cell of the grid*/
        var new_cell = this.grid.get_cell(x, y);
        if (new_cell != false && new_cell.obstacle == false){
            $('#'+new_cell.html_id).addClass('has_passenger');
            this.current_cell = new_cell;
            this.current_cell.passengers.push(this);
        }
        return new_cell;
    }
    this.remove_from = function(){
        /*removes the passenger from it's current cell*/
        if (this.current_cell != false){
            this.current_cell.passengers.shift();
            this.current_cell = false;
        }
    }
}

function car_class(type, grid, surge_needed, max_cruising_time, current_price, driving){
    /*class for the car. Includes instructions for how to execute right, left and straight moves,
    Randomly selecting moves, picking up and dropping off passengers, and keeping track of stats
    For ubers, determines when to starting and stop driving based on surge*/
    this.type = type;
    this.x;
    this.y;
    this.heading;
    this.grid = grid;
    this.current_cell = false;
    this.next_move = false;
    this.next_next_move = false;
    this.passenger = false;
    this.surge_needed = surge_needed;
    this.max_cruising_time = max_cruising_time;
    this.current_price = current_price;
    this.driving = driving;
    this.cruising_time = 0;//Time since last passenger drop off
    
    this.time_step_logic = function(){
        /*steps through the logic for a time step*/
        
        //If it's already driving
        if (this.driving == true){
            this.move();//execute move
            //If there's no passenger, calculate cruising time,
            if (this.passenger == false){
                this.cruising_time += 1;
                //if the cruising time is greater than the max time, and the surge is less than needed, stop driving
                if (this.type == 'uber' && this.cruising_time >= this.max_cruising_time && this.grid.current_surge < this.surge_needed){
                    this.remove_from();
                    this.cruising_time = 0;
                    this.driving = false;
                    this.next_next_move = false;
                    this.next_move = false
                }
            }
            //Update total driver time
            this.grid.total_driver_time += 1;
        }
        
        //If not currently driving and the surge is greater than the surge needed, start driving
        else if (this.type == 'uber' && this.grid.current_surge >= this.surge_needed){
            var random_cell = this.grid.pick_random_cell();
            this.heading = random_cell[1];
            this.set_on(random_cell[0].x, random_cell[0].y);
            this.driving = true;
            this.passenger_logic();
        }
        
        //Start all taxis
        else if (this.type == 'taxi'){//start the taxi
            var random_cell = this.grid.pick_random_cell();
            this.heading = random_cell[1];
            this.set_on(random_cell[0].x, random_cell[0].y);
            this.driving = true;
            this.passenger_logic();
        }
    }
    
    this.move = function(){
        /*Executes the next single square move if there is one. If not,*/
        if (this.next_move != false){
            this.next_move();
            this.next_move = false;
        }
        else if (this.next_next_move != false){
            this.next_next_move();
            this.next_next_move = false;
        }
        //Selects a random move
        else{
            this.pick_move();
        }
        //Pick up or drop off passengers
        this.passenger_logic();
    }
    
    this.passenger_logic = function(){
        /*logic for picking up, or dropping off a passenger*/
        
        //If there are no passengers, see if there is a ride request on the current cell, and pick him up if so
        if (this.passenger == false){
            if (this.current_cell.passengers.length > 0 ){
                this.passenger = this.current_cell.passengers[0];
                this.passenger.picked_up();
                this.cruising_time = 0;
                //Set the price of the trip
                if (this.type == 'uber'){
                    this.current_price = this.grid.current_surge * base_uber;
                }
                else if (this.type == 'taxi'){
                    this.current_price = taxi_price;
                }
            }
        }
        //If we current have a passenger, drop him off if it's the end of the trip, continue if not
        else{
            this.passenger.current_travel_time += 1;
            if (this.passenger.current_travel_time == this.passenger.destination_travel_time){
                var ride_price = this.passenger.dropped_off(this.current_price);
                this.grid.total_money += ride_price;
                if (this.current_cell.passengers.length == 0){
                    $('#'+this.current_cell.html_id).removeClass('has_passenger');
                }
                this.passenger = false;
            }
        }
    }
            
    
    this.pick_move = function(){
        /*select which direction the car will move based on the available options
         *of the current cell*/
        var valid_options = this.current_cell.valid_options[this.heading];
        
        try{
            var selected_move = valid_options[Math.floor(valid_options.length * Math.random())];
        }
        catch(err){
            console.log(this.current_cell, this.heading)
        }
        if (selected_move == 'straight'){
            if (valid_options.length > 1){
                this.go_straight(intersection=true);
            }
            else{
                this.go_straight(intersection=false);
            }
            
        }
        if (selected_move == 'right'){
            this.turn_right();
        }
        if (selected_move == 'left'){
            this.turn_left();
        }
    }
    
    this.go_straight = function(intersection){
        /*steps to go through an intercection based on current position and heading*/
        if (this.heading == 'east'){
            this.move_east();
            if (intersection == true){
                this.next_move = this.move_east;
            }
        }
        else if (this.heading == 'south'){
            this.move_south();
            if (intersection == true){
                this.next_move = this.move_south;
            }
        }
        else if (this.heading == 'north'){
            this.move_north();
            if (intersection == true){
                this.next_move = this.move_north;
            }
        }
        else if (this.heading == 'west'){
            this.move_west();
            if (intersection == true){
                this.next_move = this.move_west;
            }
        }
    }
    
    this.turn_right= function(){
        /*turns right at an intercection based on current position and heading*/
        if (this.heading == 'east'){
            this.heading = 'south';
            this.move_south();
        }
        else if (this.heading == 'south'){
            this.heading = 'west';
            this.move_west();
        }
        else if (this.heading == 'north'){
            this.heading = 'east';
            this.move_east();
        }
        else if (this.heading == 'west'){
            this.heading = 'north';
            this.move_north();
        }
    }
    
    this.turn_left = function(){
       /*turns left at an intercection based on current position and heading*/
        if (this.heading == 'east'){
            this.move_east();
            this.next_move = this.move_north;
            this.next_next_move = this.move_north;
            this.heading = 'north';
        }
        else if (this.heading == 'south'){
            this.move_south();
            this.next_move = this.move_east;
            this.next_next_move = this.move_east;
            this.heading = 'east';
        }
        else if (this.heading == 'north'){
            this.move_north();
            this.next_move = this.move_west;
            this.next_next_move = this.move_west;
            this.heading = 'west';
        }
        else if (this.heading == 'west'){
            this.move_west();
            this.next_move = this.move_south;
            this.next_next_move = this.move_south;
            this.heading = 'south';
        }
    } 
    
    //Single cell movement functions
    this.move_east = function(){
        /*move one cell east*/
        new_cell = this.set_on(this.current_cell.x+1, this.current_cell.y);
    }
    this.move_west = function(){
        /*move one cell west*/
        new_cell = this.set_on(this.current_cell.x-1, this.current_cell.y);
    }
    this.move_north = function(){
        /*move one cell north*/
        new_cell = this.set_on(this.current_cell.x, this.current_cell.y-1);
    }
    this.move_south = function(){
        /*move one cell south*/
        new_cell = this.set_on(this.current_cell.x, this.current_cell.y+1);
    }
    
    this.set_on = function(x,y){
        /*Places the car on the given x, y cell of the gird*/
        var new_cell = this.grid.get_cell(x, y);
        if (new_cell != false && new_cell.obstacle == false){
            this.remove_from();
            $('#'+new_cell.html_id).addClass('has_car');
            $('#'+new_cell.html_id).addClass('heading_'+this.heading);
            if (this.passenger != false){
                $('#'+new_cell.html_id).addClass('has_passenger');
            }
            this.current_cell = new_cell;
        }
        return new_cell;
    }
    
    this.remove_from = function(){
        /*removes the car from it's current cell*/
        if (this.current_cell != false){
            $('#'+this.current_cell.html_id).removeClass('has_car');
            $('#'+this.current_cell.html_id).removeClass('heading_north');
            $('#'+this.current_cell.html_id).removeClass('heading_south');
            $('#'+this.current_cell.html_id).removeClass('heading_east');
            $('#'+this.current_cell.html_id).removeClass('heading_west');
            if (this.passenger != false && this.current_cell.passengers.length == 0 ){
                $('#'+this.current_cell.html_id).removeClass('has_passenger');
            }
        }
    }
}

function cell_class(x, y, obstacle, grid){
    /*Class for carrying around cell info*/
    this.x = x;
    this.y = y;
    this.obstacle = obstacle;
    this.headings = new headings;
    this.valid_options = {};
    this.html = '';
    this.html_id = grid.html_id + '_'+this.x+"-"+this.y;
    this.passengers = [];
    this.grid = grid
    
    this.make_html = function(){
        /*Makes the html for this cell*/
        if (this.obstacle == false){
            var heading_string = this.headings.make_headings_string();
            var valid_options_string = JSON.stringify(this.valid_options);
            this.html = "<td id="+this.html_id+ " class='"+this.make_css_class_string()+"' x="+this.x+" y="+this.y+" '>"+ "<div class='heading_container'><div class='heading_north'></div><div class='heading_south'></div><div class='heading_east'></div><div class='heading_west'></div></div></td>";
        }
        else{
            this.html = "<td id="+this.html_id+ " class='obstacle "+this.make_css_class_string()+"' x="+this.x+" y="+this.y+" '>"+"<div></div></td>";
        }
        return this.html;
    }
    
    this.make_css_class_string = function(){
        /*Makes the css class for styling the grid*/
        
        if (this.obstacle == false){
            var css_class_string = 'street ';
            if (this.headings.north != false && this.valid_options['north'].length != 0 && this.y < this.grid.size-1){
                css_class_string += 'north ';
            }
            if (this.headings.south != false && this.valid_options['south'].length != 0 && this.y > 0){
                css_class_string += 'south ';
            }
            if (this.headings.west != false && this.valid_options['west'].length != 0 && this.x < this.grid.size-1){
                css_class_string += 'west ';
            }
            if (this.headings.east != false && this.valid_options['east'].length != 0 && this.x > 0){
                css_class_string += 'east ';
            }
        }
        else{
            if (this.x%2 == 0 && this.y%2 == 0){
                var css_class_string = 'northwest';
            }
            else if (this.x%2 == 1 && this.y%2 == 0){
                var css_class_string = 'northeast';
            }
            else if (this.x%2 == 1 && this.y%2 == 1){
                var css_class_string = 'southeast';
            }
            else if (this.x%2 == 0 && this.y%2 == 1){
                var css_class_string = 'southwest';
            }
        }
        
        return css_class_string;
    }
}

function headings(){
    /*Class for storing headings*/
    this.north = false;
    this.south = false;
    this.east = false;
    this.west = false;
    this.list = [];
    
    this.make_headings_string = function(){
        var headings_string = '';
        if (this.north == true){
            headings_string = headings_string + "/\\";
        }
        if (this.east == true){
            headings_string = headings_string + ">";
        }
        if (this.south == true){
            headings_string = headings_string + "\\/";
        }
        if (this.west == true){
            headings_string = headings_string + "<";
        }
        return headings_string;
    }
}

function getRandomInt(min, max) {
    /*Returns a random integer between min (inclusive) and max (inclusive)*/
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
