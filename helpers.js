// ------------------------------------------------------------------------
// General Helpers
// ------------------------------------------------------------------------
var shuffle = function (arr) {
  var a = arr;
  var j, x, i;
  for (i = a.length; i; i--) {
      j = Math.floor(Math.random() * i);
      x = a[i - 1];
      a[i - 1] = a[j];
      a[j] = x;
  }
  return a;
};

var partition = function(arr, chunk) {
  var acc = [];
  for (var i = 0, j = arr.length; i < j; i += chunk) {
    acc.push(arr.slice( i, i+chunk ));
  }
  return acc;
};

var range = function(start, end) {
  var acc = [];
  for (var i = start; i < end; i++) {
    acc.push(i);
  }
  return acc;
};

var random_between = function(min, max) {
    return Math.floor(Math.random() * ( max - min + 1) + min);
}

var rand_nth = function(arr) {
  var rand_pos = random_between(0, arr.length);
  return arr[rand_pos];
}

// takes a function and one or more arrays and returns
// the result of applying the function to each elements of the arrays
var map = function() {
  var f,
      arrays = [],
      acc = [];

  for (var k in arguments) {
    if (!f)
      f = arguments[k];
    else
      arrays.push(arguments[k]);
  }

  for (var i = 0; i < arrays[0].length; i++) {
    var elts = arrays.map(function(arr) { return arr[i]; });
    acc.push(f.apply(null, elts));
  }

  return acc;
}

var contains = function(arr_set, arr) {
  return arr_set.some(function(node) {
    return node[0] === arr[0] && node[1] === arr[1];
  });
};

function ArraySet(arr) {
  var acc = [];
  for (var i = 0; i < arr.length; i++) {
    if (!acc.length) {
      acc.push(arr[i]);
    } else if (!contains(acc, arr[i])) {
      acc.push(arr[i]);
    }
  }
  this.acc = acc;
}

// ------------------------------------------------------------------------
// State Management Helpers
// Based on `re-frame`s concept
// ------------------------------------------------------------------------

// events container
var events = {};

// - register an event for later dispatching
// - `f` is an effectful funcion that takes the state container
// and other arguments
// - Ideally all changes to `db` should be done through this
var reg_event_db = function(event, f) {
  if (events[event]) {
    console.log("Rewriting `" + event + "`.");
  }
  events[event] = f.bind(null, db);
  return true;
};

// calls a registered handler
var dispatch = function(params) {
  var event, args, f;
  // event name
  event = params[0];
  // other arguments that may have been provided
  args = params.slice(1, params.length);
  // check if the function was previously registered
  f = events[event];
  if (f) {
    return f.apply(null, args);
  } else {
    console.log("No such function registered: `" + event + "`.");
    return false;
  }
};
