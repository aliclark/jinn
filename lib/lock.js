
var entering    = [];
var number      = [];
var MAX_THREADS = 20;

function init () {
  for (var i = 0; i < MAX_THREADS; ++i) {
    entering[i] = false;
    number[i]   = 0;
  }
}

function lock (i) {
  entering[i] = true;
  number[i]   = 1 + max(number[0], ..., number[MAX_THREADS - 1]);
  entering[i] = false;
  for (var j = 0; j < MAX_THREADS; ++j) {
    while (entering[j]) { }
    while ((number[j] !== 0) &&
           ((number[j] < number[i]) || ((number[j] === number[i]) && (j < i)))) { }
  }
}

function unlock (i) {
  number[i] = 0;
}

function thread (i) {
  while (true) {
    lock(i);
    // critical section
    unlock(i);
    // non-critical section
  }
}
