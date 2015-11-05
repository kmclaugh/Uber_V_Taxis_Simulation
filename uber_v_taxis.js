
$(window).load(function () {
    
    $(document).ready(function () {
        var the_grid = new grid_class(18);
        the_grid.create_grid();
        the_grid.add_headings();
        the_grid.add_options();
        the_grid.create_html();
        
        $('#grid').append(the_grid.html);
        
        car = new car_class(8,4, 'south', the_grid);
        car.set_on(8,4);
        
        $('#time_step').click(function(){
            car.move();
        });
        
        $('#move_north').click(function(){
            car.move_north();
        });
        $('#move_south').click(function(){
            car.move_south();
        });
        $('#move_east').click(function(){
            car.move_east();
        });
        $('#move_west').click(function(){
            car.move_west();
        });
        
    
    });
});

function car_class(start_x, start_y, start_heading, grid){
    /*class for the car*/
    this.x = start_x;
    this.y = start_y;
    this.heading = start_heading;
    this.grid = grid;
    this.current_cell = false;
    this.next_move = false;
    this.next_next_move = false;
    
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
    }
    
    this.pick_move = function(){
        /*select which direction the car will move based on the available options
         *of the current cell*/
        
        var valid_options = this.current_cell.valid_options[this.heading];
        var selected_move = valid_options[Math.floor(valid_options.length * Math.random())];
        console.log(selected_move);
        if (selected_move == 'straight'){
            this.go_straight();
        }
        if (selected_move == 'right'){
            this.turn_right();
        }
        if (selected_move == 'left'){
            this.turn_left();
        }
    }
    
    this.go_straight = function(){
        /*steps to go through an intercection based on current position and heading*/
        if (this.heading == 'east'){
            this.move_east();
            this.next_move = this.move_east;
        }
        else if (this.heading == 'south'){
            this.move_south();
            this.next_move = this.move_south;
        }
        else if (this.heading == 'north'){
            this.move_north();
            this.next_move = this.move_north;
        }
        else if (this.heading == 'west'){
            this.move_west();
            this.next_move = this.move_west;
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
            this.current_cell = new_cell;
        }
        return new_cell;
    }
    this.remove_from = function(){
        /*removes the car from it's current cell*/
        if (this.current_cell != false){
            $('#'+this.current_cell.html_id).removeClass('has_car');
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
                    valid_options['north'] = self.find_valid_options(cell, 'north');
                }
                if (cell.headings.west == true){
                    valid_options['west'] = self.find_valid_options(cell, 'west');
                }
                if (cell.headings.east == true){
                    valid_options['east'] = self.find_valid_options(cell, 'east');
                }
                if (cell.headings.south == true){
                    valid_options['south'] = self.find_valid_options(cell, 'south');
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