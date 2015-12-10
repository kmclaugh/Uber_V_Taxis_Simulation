//Macros
var real_time_per_step;
var simulation_time_per_step;
var base_uber;
var taxi_price;

//Globals
var timer;
var simulation_time;
var total_steps;
var uber_grid;
var taxi_grid;

function reset_global_variables(){
    /*Sets the global vairables*/
    //Macros
    real_time_per_step = 100;
    simulation_time_per_step = 30;//seconds
    base_uber = 0.5;
    taxi_price = 3;
    
    //Globals
    total_steps = 0;
    simulation_start_time = new Date(2015, 11, 15, 12, 0);
    simulation_end_time = new Date(2015, 11, 15, 23, 59);
    simulation_time = new Date(simulation_start_time);
    timer = null;
    //taxi
    taxi_grid;
    taxi_grid.car_list = [];
    taxi_grid.passengers_list = [];
    taxi_grid.current_surge = 1;
    //uber
    uber_grid;
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
        
        
        //uber
        uber_grid = new grid_class(18, 'uber_grid', 'uber');
        uber_grid.create_grid();
        uber_grid.add_headings();
        uber_grid.add_options();
        uber_grid.create_html();
        //taxi
        taxi_grid = new grid_class(18, 'taxi_grid', 'taxi');
        taxi_grid.create_grid();
        taxi_grid.add_headings();
        taxi_grid.add_options();
        taxi_grid.create_html();
        
        reset_global_variables();
        create_taxis(5);
        
        $("#start").click(function() {
            $('#mean').slider('disable');
            $('#standard_dev').slider('disable');
            
            if (timer !== null) return;
            timer = window.setInterval(function(){
               time_step();
            }, real_time_per_step);
        });
        
        $("#stop").click(function() {
            clearInterval(timer);
            timer = null;
        });
        
        $("#reset").click(function() {
            clearInterval(timer);
            reset_global_variables();
            update_stats();
            uber_grid.reset();
            generate_data();
            $('#mean').slider('enable');
            $('#standard_dev').slider('enable');
            var svg = d3.select('#demand_graph_svg');
            svg.select('.line').remove();
        });
        
        $("#demand_slider").slider({
            reversed : true,
            ticks : [0, 100],
            scale: 'linear',
            step: 1,
            ticks_snap_bounds: 1
        });
        $("#demand_slider").on("slide", function(slideEvt) {
            uber_grid.current_demand = slideEvt.value;
            taxi_grid.current_demand = slideEvt.value;
            $("#current_demand").val(slideEvt.value);
        });
        $('#current_demand').change(function(){
            var new_value = Number($(this).val());
            $("#demand_slider").slider('setValue', new_value);
        });
    
    });
});

function time_step(){
    uber_grid.time_step_logic();
    taxi_grid.time_step_logic();
    
    total_steps += 1;
    simulation_time.setSeconds(simulation_time.getSeconds() + simulation_time_per_step);
    update_stats(uber_grid);
    update_demand_graph(uber_grid);
}

function update_stats(grid){
    /*Updates the statistics at the end of a time step*/
    average_ride_time = grid.total_ride_time/grid.total_rides_completed;
    average_wait_time = grid.total_wait_time/grid.total_rides_started;
    average_ride_price = grid.total_ride_price/grid.total_rides_completed;
    price_per_minute = grid.total_ride_price/grid.total_ride_time * 1/simulation_time_per_step * 60//sec/min
    $('#'+grid.type+'_total_steps').text(total_steps);
    $('#'+grid.type+'_current_total_wait_time').text(uber_grid.current_total_wait_time);
    $('#'+grid.type+'_current_surge').text(uber_grid.current_surge);
    $('#'+grid.type+'_current_total_ubers').text(uber_grid.current_total_cars);
    $('#'+grid.type+'_average_ride_price').text(price_per_minute);
    $('#'+grid.type+'_average_ride_time').text(average_ride_time);
    $('#'+grid.type+'_average_wait_time').text(average_wait_time);
    
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
        this.current_wait_time += 1;
        this.grid.current_total_wait_time += this.current_wait_time;
    }
    
    this.picked_up = function(){
        /*Logic for being picked up by the car*/
        this.remove_from();
        this.waiting = false;
        this.wait_time = total_steps+1 - this.start_step;
        this.grid.total_rides_started += 1;
        this.grid.total_wait_time += this.wait_time;
        var index = this.grid.passengers_list.indexOf(this);
        this.grid.passengers_list.splice(index, 1);
    }
        
    this.dropped_off = function(current_price){
        /*logic for being dropped off*/
        this.grid.total_ride_time += this.destination_travel_time;
        this.grid.total_rides_completed += 1;
        this.grid.total_ride_price += this.destination_travel_time * current_price;
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

function create_taxis(number_of_taxis) {
    /*Creates the given number of taxis and adds them to the taxi grid object*/
    for (t=0; t<number_of_taxis; t++){
        taxi = new car_class(type='taxi', grid=taxi_grid, surge_needed=0, max_cruising_time=0, current_price=taxi_price, driving=false);
        taxi_grid.car_list.push(taxi);
    }
}

function car_class(type, grid, surge_needed, max_cruising_time, current_price, driving){
    /*class for the car*/
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
    this.cruising_time = 0;
    
    this.time_step_logic = function(){
        /*steps through the logic for a time step*/
        if (this.driving == true){
            this.move();
            if (this.passenger == false){
                this.cruising_time += 1;
                if (this.type == 'uber' && this.cruising_time >= this.max_cruising_time && this.grid.current_surge < this.surge_needed){
                    this.remove_from();
                    this.cruising_time = 0;
                    this.driving = false;
                    this.next_next_move = false;
                    this.next_move = false
                }
            }
        }
        
        else if (this.type == 'uber' && this.grid.current_surge >= this.surge_needed){
            var random_cell = this.grid.pick_random_cell();
            this.heading = random_cell[1];
            this.set_on(random_cell[0].x, random_cell[0].y);
            this.driving = true;
            this.passenger_logic();
        }
        
        else if (this.type == 'taxi'){//start the taxi
            var random_cell = this.grid.pick_random_cell();
            this.heading = random_cell[1];
            this.set_on(random_cell[0].x, random_cell[0].y);
            this.driving = true;
            this.passenger_logic();
        }
    }
    
    this.move = function(){
        if (this.next_move != false){
            this.next_move();
            this.next_move = false;
        }
        else if (this.next_next_move != false){
            this.next_next_move();
            this.next_next_move = false;
        }
        else{
            this.pick_move();
        }
        this.passenger_logic();
    }
    
    this.passenger_logic = function(){
        /*logic for picking up, or dropping off a passenger*/
        if (this.passenger == false){
            if (this.current_cell.passengers.length > 0 ){
                this.passenger = this.current_cell.passengers[0];
                this.passenger.picked_up();
                this.cruising_time = 0;
                if (this.type == 'uber'){
                    this.current_price = this.grid.current_surge * base_uber;
                }
            }
        }
        else{
            this.passenger.current_travel_time += 1;
            if (this.passenger.current_travel_time == this.passenger.destination_travel_time){
                this.passenger.dropped_off(this.current_price);
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
            this.move_south();
            this.heading = 'south';
        }
        else if (this.heading == 'south'){
            this.move_west();
            this.heading = 'west';
        }
        else if (this.heading == 'north'){
            this.move_east();
            this.heading = 'east';
        }
        else if (this.heading == 'west'){
            this.move_north();
            this.heading = 'north';
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
    
    this.move_east = function(){
        new_cell = this.set_on(this.current_cell.x+1, this.current_cell.y);
    }
    this.move_west = function(){
        new_cell = this.set_on(this.current_cell.x-1, this.current_cell.y);
    }
    this.move_north = function(){
        new_cell = this.set_on(this.current_cell.x, this.current_cell.y-1);
    }
    this.move_south = function(){
        new_cell = this.set_on(this.current_cell.x, this.current_cell.y+1);
    }
    
    this.set_on = function(x,y){
        /*Places the car on the given x, y cell of the gird*/
        var new_cell = this.grid.get_cell(x, y);
        if (new_cell != false && new_cell.obstacle == false){
            this.remove_from();
            $('#'+new_cell.html_id).addClass('has_car');
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
            if (this.passenger != false && this.current_cell.passengers.length == 0 ){
                $('#'+this.current_cell.html_id).removeClass('has_passenger');
            }
        }
    }
}
    

function grid_class(size, html_id, type){
    /*Class for carrying around grid info*/
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
    
    this.time_step_logic = function(){
        this.current_total_cars = 0;
        for (c=0; c<this.car_list.length; c++){
            var car = this.car_list[c];
            
            car.time_step_logic();
            if (car.driving == true){
                this.current_total_cars += 1;
            }
        }
        
        if (this.passengers_list.length < this.current_demand){
            var add_passengers = this.current_demand - this.passengers_list.length;
            this.create_random_passengers(add_passengers);
        }
        
        this.current_total_wait_time = 0;
        for (p=0; p<this.passengers_list.length; p++){
            passenger = this.passengers_list[p];
            passenger.time_step_logic();
        }
        if (this.type == 'uber') {
            //Surge logic
            var average_current_wait = this.current_total_wait_time/this.passengers_list.length;
            if (this.current_total_wait_time > this.previous_total_weight_time + 100){
                var current_total_wait_time_rounded = Math.floor(this.current_total_wait_time / 100) * 100;
                var add_surge = (current_total_wait_time_rounded - this.previous_total_weight_time)/100/10;
                this.current_surge += add_surge;
                this.previous_total_weight_time = current_total_wait_time_rounded;
            }
            else if (this.current_total_wait_time <= this.previous_total_weight_time){
                var current_total_wait_time_rounded = Math.floor(this.current_total_wait_time / 100) * 100;
                if (current_total_wait_time_rounded < this.previous_total_weight_time) {
                    var minus_surge = (current_total_wait_time_rounded - this.previous_total_weight_time)/100/10;
                }
                else if (this.current_surge > 1){
                    var minus_surge = -0.1;
                }
                else{
                    var minus_surge = 0;
                }
                this.current_surge += minus_surge;
                this.previous_total_weight_time = current_total_wait_time_rounded;
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
        table_string = '<table>'
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
    
    this.make_html = function(){
        if (this.obstacle == false){
            var heading_string = this.headings.make_headings_string();
            var valid_options_string = JSON.stringify(this.valid_options);
            this.html = "<td id="+this.html_id+" x="+this.x+" y="+this.y+" title='"+valid_options_string+"'>"+ "</td>";
        }
        else{
            this.html = "<td id="+this.html_id+" class='obstacle' x="+this.x+" y="+this.y+" title='"+valid_options_string+"'>"+"</td>";
        }
        return this.html;
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