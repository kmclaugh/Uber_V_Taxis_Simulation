//Macros
var real_time_per_step;
var simulation_time_per_step;
var base_price;
var taxi_price;

//Gloabls
var timer;
var the_grid;
var uber_list;
var passengers_list;
var current_surge;
var simulation_time;

//Stats
var total_steps;
var total_rides_started;
var total_rides_completed;
var total_wait_time;
var total_ride_time;
var total_ride_price;
var current_total_wait_time;
var previous_total_weight_time;
var current_demand;
var current_total_ubers;
var demand_data = [];
var driver_data = [];
var price_data = [];
var average_ride_price;

function reset_global_variables(){
    /*Sets the global vairables*/
    //Macros
    real_time_per_step = 100;
    simulation_time_per_step = 1;//min
    base_price = 2.5;
    taxi_price = 3;
    
    //Gloabls
    timer = null;
    the_grid;
    uber_list = [];
    passengers_list = [];
    current_surge = 1;
    simulation_start_time = new Date(2015, 11, 15, 9, 0);
    simulation_end_time = new Date(2015, 11, 15, 23, 59);
    simulation_time = new Date(simulation_start_time);
    
    //Stats
    total_steps = 0;
    total_rides_started = 0;
    total_rides_completed = 0;
    total_wait_time = 0;
    total_ride_time = 0;
    total_ride_price = 0;
    current_total_wait_time = 0;
    previous_total_weight_time = 0;
    current_demand = 0;
    current_total_ubers;
    demand_data = [];
    driver_data = [];
    price_data = [];
    average_ride_price = 0;
}
reset_global_variables();

$(window).load(function () {
    
    $(document).ready(function () {
        the_grid = new grid_class(18);
        the_grid.create_grid();
        the_grid.add_headings();
        the_grid.add_options();
        the_grid.create_html();
        
        $('#grid').append(the_grid.html);
        
        
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
            the_grid.reset();
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
            current_demand = slideEvt.value;
            $("#current_demand").val(slideEvt.value);
        });
        $('#current_demand').change(function(){
            var new_value = Number($(this).val());
            $("#demand_slider").slider('setValue', new_value);
        });
    
    });
});

function time_step(){
    current_total_ubers = 0;
    for (u=0; u<uber_list.length; u++){
        uber_car = uber_list[u];
        uber_car.time_step_logic();
        if (uber_car.driving == true){
            current_total_ubers += 1;
        }
    }
    
    if (passengers_list.length < current_demand){
        var add_passengers = current_demand - passengers_list.length;
        create_random_passengers(add_passengers);
    }
    
    current_total_wait_time = 0;
    for (p=0; p<passengers_list.length; p++){
        passenger = passengers_list[p];
        passenger.current_wait_time += 1;
        current_total_wait_time += passenger.current_wait_time;
    }
    if (current_total_wait_time > previous_total_weight_time + 100){
        var current_total_wait_time_rounded = Math.floor(current_total_wait_time / 100) * 100;
        var add_surge = (current_total_wait_time_rounded - previous_total_weight_time)/100;
        current_surge += add_surge;
        previous_total_weight_time = current_total_wait_time_rounded;
    }
    else if (current_total_wait_time < previous_total_weight_time){
        var current_total_wait_time_rounded = Math.floor(current_total_wait_time / 100) * 100;
        var minus_surge = (current_total_wait_time_rounded - previous_total_weight_time)/100;
        current_surge += minus_surge;
        previous_total_weight_time = current_total_wait_time_rounded;
    }
    total_steps += 1;
    simulation_time.setMinutes(simulation_time.getMinutes() + simulation_time_per_step);
    update_stats()
    update_demand_graph(demand_data, driver_data, price_data);
}

function update_stats(){
    /*Updates the statistics at the end of a time step*/
    $('#total_steps').text(total_steps);
    $('#current_total_wait_time').text(current_total_wait_time);
    $('#current_surge').text(current_surge);
    $('#current_total_ubers').text(current_total_ubers);
    $('#average_ride_price').text(average_ride_price);
    
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
        

function create_random_passengers(number_of_passengers){
    /*Creates the given number of random passengers*/
    for (counter=0; counter<number_of_passengers; counter++){
        create_random_passenger();
    }
}

function create_random_passenger(){
    /*Create a passenger and places them randomly on the grid*/
    var random_cell = the_grid.pick_random_cell();
    var passenger = new passenger_class(the_grid);
    passenger.set_on(random_cell[0].x, random_cell[0].y);
    passengers_list.push(passenger);
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
    
    this.current_travel_time = 0;
    
    this.picked_up = function(){
        /*Logic for being picked up by the car*/
        this.remove_from();
        this.waiting = false;
        this.wait_time = total_steps+1 - this.start_step;
        total_rides_started += 1;
        total_wait_time += this.wait_time;
        var average_wait_time = total_wait_time/total_rides_started;
        $('#average_wait_time').text(average_wait_time);
        var index = passengers_list.indexOf(this);
        passengers_list.splice(index, 1);
    }
        
    this.dropped_off = function(current_price){
        /*logic for being dropped off*/
        total_ride_time += this.destination_travel_time;
        total_rides_completed += 1;
        var average_ride_time = total_ride_time/total_rides_completed;
        $('#average_ride_time').text(average_ride_time);
        total_ride_price += this.destination_travel_time * current_price;
        average_ride_price = total_ride_price/total_rides_completed;
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
                if (this.cruising_time >= this.max_cruising_time && current_surge < this.surge_needed){
                    this.remove_from();
                    this.cruising_time = 0;
                    this.driving = false;
                    this.next_next_move = false;
                    this.next_move = false
                }
            }
        }
        
        else if (current_surge >= this.surge_needed){
            var random_cell = the_grid.pick_random_cell();
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
                    this.current_price = current_surge * base_price;
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
        //console.log(this.current_cell, this.heading)
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
    

function grid_class(size){
    /*Class for carrying around grid info*/
    self = this;
    this.size = size;
    this.array = [];
    this.html = '';
       
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
                    var cell = new cell_class(x, y, true);
                }
                else{
                    var cell = new cell_class(x, y, false);
                }
                row.push(cell);
            }
            self.array.push(row);
        }
        return self.array;
    }
}
                

function cell_class(x, y, obstacle){
    /*Class for carrying around cell info*/
    this.x = x;
    this.y = y;
    this.obstacle = obstacle;
    this.headings = new headings;
    this.valid_options = {};
    this.html = '';
    this.html_id = this.x+"-"+this.y;
    this.passengers = [];
    
    this.make_html = function(){
        if (this.obstacle == false){
            var heading_string = this.headings.make_headings_string();
            var valid_options_string = JSON.stringify(this.valid_options);
            this.html = "<td id="+this.html_id+" x="+this.x+" y="+this.y+" title='"+valid_options_string+"'>"+this.x+","+this.y+ heading_string + "</td>";
        }
        else{
            this.html = "<td id="+this.html_id+" class='obstacle' x="+this.x+" y="+this.y+" title='"+valid_options_string+"'>"+this.x+","+this.y+"</td>";
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