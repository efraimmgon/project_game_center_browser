
// state container
function DB() {
}

db = new DB();

// ---------------------------------------------------------------------
// App Specific Helpers
// ---------------------------------------------------------------------

var same_coords = function(c1, c2) {
  return (c1[0] === c2[0]) &&
         (c1[1] === c2[1]);
}

// Takes the snake and the board-size as arguments,
//  and returns a random position not colliding with the snake body
var rand_free_position = function(snake, xy) {
  var x = xy[0],
      y = xy[1],
      snake_positions_set = new ArraySet(snake.body);
      free_positions = board_positions(x, y).filter(function(xy) {
        return !contains(snake_positions_set, xy);
      });
  if (free_positions.length) {
    return rand_nth(free_positions);
  }
};


// Move the whole snake based on positions and directions of each
// snake body segments
var move_snake = function(snake) {
  var sum = function(a, b) { return a + b; };
  var head_new_position = map(sum, snake.direction, snake.body[0]);
  snake.body.unshift(head_new_position);
  snake.body.pop();
  return snake;
};

// Computes x or y tail coordinate according to the last 2 values of
// that coordinate
var snake_tail = function(coord1, coord2) {
  if (coord1 === coord2) {
    return coord1;
  } else if (coord1 > coord2) {
    return coord2 - 1;
  } else {
    return coord2 + 1;
  }
};

// Evaluates the new snake position in a context of the whole game
var process_move = function(db) {
  if (same_coords(db.point, db.snake.body[0])) {
    grow_snake(db.snake);
    db.points += 1;
    db.point = rand_free_position(db.snake, db.board);
  }
  return db;
};

// Append a new tail body segment to the snake
var grow_snake = function(snake) {
  var len, first, second, x, y;
  len = snake.body.length;
  first = snake.body[len - 1];
  second = snake.body[len - 2];
  x = snake_tail(first[0], second[0]);
  y = snake_tail(first[1], second[1]);

  snake.body.push([x, y]);
  return snake;
};

var board_positions = function(x, y) {
  var board = [];
  $.each(range(0, x), function(i, x_pos) {
    $.each(range(0, y), function(j, y_pos) {
      board.push([x_pos, y_pos]);
    });
  });
  return board;
};

var initial_state = {
  init: function() {
    var snake = {
      direction: [1, 0],
      body: [[3, 2], [2, 2], [1, 2], [0, 2]]
    };
    var board = [30, 25];

    this.point = rand_free_position(snake, board);
    this.board = board;
    this.snake = snake;
    this.points = 0;
    this.is_game_running = true;
  }
};
initial_state.init();

var key_code_to_move = {
  38: [0, -1],
  40: [0, 1],
  39: [1, 0],
  37: [-1, 0]
};

// Changes the snake head direction, only when it's perpendicular to the
// old head direction
var change_snake_direction = function(new_direction, direction) {
  if (new_direction[0] === direction[0] ||
      new_direction[1] === direction[1]) {
    return direction;
  } else {
    return new_direction;
  }
};

// Returns true if the snake collision with the board edges or itself
// (the snake body) is detected
var collisions = function(snake, board) {
  var body = snake.body,
      direction = snake.direction,
      x = board[0],
      y = board[1],
      border_x = new Set([x, -1]);
      border_y = new Set([y, -1]);
      future_x = direction[0] + body[0][0];
      future_y = direction[1] + body[0][1];
  return border_x.has(future_x) ||
         border_y.has(future_y) ||
         contains(new ArraySet(body.slice(1)), [future_x, future_y]);
};

// ---------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------

// Renders a player's score
var score = function() {
  $(".score").html("Score: " + db.points);
};

// Renders the game over overlay if the game is finished
var game_over = function() {
  var $overlay = $("<div></div>");
  if (!db.is_game_running) {
    var $play = $("<div></div>")
      .addClass("play")
      .html("<h1>↺</h1>");
    $overlay
      .addClass("overlay")
      .append($play);
  }
  $("#game-over").html($overlay);
};

// Renders the game board area with snake and the food item
var render_board = function() {
  var width, height, $table, snake_positions, current_point;
  width = db.board[0];
  height = db.board[1];
  snake_positions = new ArraySet(db.snake.body);
  current_point = db.point;

  $table = $("<table></table>")
    .addClass("stage")
    .css({height: 377, width: 527});
  $.each(range(0, height), function(y) {
    var $tr = $("<tr></tr>");
    $.each(range(0, width), function(x) {
      var current_pos, $cell;
      current_pos = [x, y];
      $cell = $("<td></td>");
      if (contains(snake_positions, current_pos)) {
        $cell.addClass("snake-on-cell");
      } else if ((current_pos[0] === current_point[0]) &&
                 (current_pos[1] === current_point[1])) {
        $cell.addClass("point");
      } else {
        $cell.addClass("cell");
      }
      $tr.append($cell);
    });
    $table.append($tr);
  });
  $(".stage").replaceWith($table);
};

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

reg_event_db("initialize", function(db) {
  initial_state.init();
  db.board = initial_state.board;
  db.snake = initial_state.snake;
  db.points = initial_state.points;
  db.is_game_running = initial_state.is_game_running;
  db.point = initial_state.point;

  $("#game-over").html("");
  return db;
});

reg_event_db("next-state", function(db) {
  if (db.is_game_running) {
    if (collisions(db.snake, db.board)) {
      db.is_game_running = false;
      game_over();
    } else {
      move_snake(db.snake);
      process_move(db);
      score();
      render_board();
    }
  }
  return db;
});

reg_event_db("change-direction", function(db, new_direction) {
  db.snake.direction = change_snake_direction(new_direction, db.snake.direction);
  return db;
});

// ---------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------


// main rendering function
var game = function() {
  render_board();
  score();
  game_over();
};

// main app function
var run = function() {
  dispatch(["initialize"]);
  game();
};

$(document).ready(function() {
  // start game
  run();

  // listen to directions input
  $(window).on("keydown", function(e) {
    var key_code = e.keyCode;
    if (key_code_to_move[key_code]) {
      dispatch(["change-direction", key_code_to_move[key_code]]);
    }
  });

  // restart game when over
  $("#game-over").on("click", ".play", function(){
    console.log("hi")
    dispatch(["initialize"]);
  });

  // move snake
  snake_moving = setInterval(function() {
    dispatch(["next-state"]);
  }, 300);

});
