
// Takes the sys_call list and sets up 

function generate_call (pid, n) {
  window['req_'  + n] = false;
  window['args_' + n] = null;
  window[n] = function () {
    window['args_' + n] = arguments;
    window['req_'  + n] = true;
    return sys_call(pid, n);
  };
}

function generate_calls () {
  var pid   = get_pid();
  generate_call(pid, 'get_syscalls');
  var calls = get_syscalls();

  // Install the sys call mechanism in memory for each of the sys calls available.
  for (var i = 0, len = calls.length; i < len; ++i) {
    generate_call(pid, calls[i]);
  }
}

// Tidy up after ourselves
window.generate_call  = undefined;
window.generate_calls = undefined;

