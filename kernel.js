
/*
Since the physical user can edit the Javascript,
they are just assumed to be root, no password needed.
However we still want to be able to run untrusted code in a sandbox,
so it will behave like *nix, but with no password needed to perform SU.

However, it should be up to init to sort this out, so that more than just 2 users can be specified.
And therefore init should be reasonably modular

We have an open problem in that we would like to have a concept of "files"
held in kernel memory, yet I have no idea as to how this system might look.

I'd also like to add get_args, get_stdin, get_stdout and get_stderr as sys_calls.
*/


// What we actually want to do is wipe window completely clean,
// so that only sys_call is left on it, and provide everything the process
// needs through sys_calls.
//
// We can then see which processes are waiting on resources once main finishes
// and clean up the other ones.


// I think there is a big problem: window.Components.content = undefined
// is causing the processes to fail and has been commented out,
// but this leaves the child process with references into kernel memory!


///////////////////////////////////// Processes
// processes perform a software action and can be controlled by a user, other applications or the OS.
// status{pending,suspended,active,running}

var proc_table = {};

var proc_count = 0;

function proc_spawn (pid, code, args, stdin, stdout, stderr, cback) {

  var newpid = proc_count++;

	// create an <iframe>
	var iframe = document.createElement( "iframe");

  if (!stdin)  { stdin  = io_get_stdin(pid);  }
  if (!stdout) { stdout = io_get_stdout(pid); }
  if (!stderr) { stderr = io_get_stderr(pid); }
	proc_table[newpid] = [pid, args, stdin, stdout, stderr, cback, iframe];

	document.getElementById('process').appendChild( iframe);

	var myproc = iframe.contentWindow.document.open("text/html");

	// write a script into the <iframe> and create the sandbox
	myproc.write(
	  "<script type='text/ecmascript'>\n<!--\n\n" +

	  "function get_pid () { return " + newpid + "; }\n\n" +

    // This is the only reference into kernel memory
    // that that we want to have left inside the process after init.
    "var sys_call = parent.sys_call;\n\n" +

    // Try our damndest to destroy all reference to parent memory.
    // This is quite a big problem... I don't think I've got them all.


    // Takes the sys_call list and sets up 

    "function generate_call (pid, n) {\n" +
    "  window['req_'  + n] = false;\n" +
    "  window['args_' + n] = null;\n" +
    "  window[n] = function () {\n" +
    "    window['args_' + n] = arguments;\n" +
    "    window['req_'  + n] = true;\n" +
    "    return sys_call(pid, n);\n" +
    "  };\n" +
    "}\n" +

    "function generate_calls () {\n" +
    "  var pid   = get_pid();\n" +
    "  generate_call(pid, 'get_syscalls');\n" +
    "  var calls = get_syscalls();\n" +

    // Install the sys call mechanism in memory for each of the sys calls available.
    "  for (var i = 0, len = calls.length; i < len; ++i) {\n" +
    "    generate_call(pid, calls[i]);\n" +
    "  }\n" +
    "}\n" +

    // Tidy up after ourselves
    "generate_calls();\n" +

    "window.generate_call  = undefined;\n" +
    "window.generate_calls = undefined;\n" +

    "window.parent             = undefined;\n" +
    "window.top                = undefined;\n" +
//    "window.Components.content = undefined;\n" +

    // For some reason I think these must be undefined within
    // the same script tag as the code trying to use it.
    "window.setTimeout  = undefined;\n" +
    "window.setInterval = undefined;\n\n" +

    code +

    // Of course, this will fail miserably if the process code has
    // messed with the sys_call system.
    "\n\ntry { check_term(main()); } catch (e) { }" +

	  "\n\n-->\n</script>\n");
	myproc.close();

	return newpid;
}

function proc_get_mem (pid) {
  return proc_table[pid][6]["contentWindow"];
}

function proc_exit (pid, s) {
	document.getElementById('process').removeChild( proc_table[pid][6]);
	var cback = proc_table[pid][5];
  proc_table[pid] = undefined;
	if (cback) {
	  cback(s);
	}
  return null;
}

// Does not try to force an exit, but instead checks whether a process is waiting
// on any resources, and if not, terminates it.
// The kernel should make sure this is called after each resource callback completes
// to check if we are no longer waiting.
// This should be implemented as a counter - +1 for start and +1 for every resource creation.
function proc_check_term (pid, s) {
  
}

///////////////////////////////  STORAGE

// We also need to add in here a bit of memory in kernel space,
// which is globally editable and readable by processes - subject to permissions.

function fs_xhr() {
  var ajaxRequest;  try {
    ajaxRequest = new XMLHttpRequest;
  } catch (exception) {
    var indeces = ['MSXML2.XMLHTTP.5.0',  'MSXML2.XMLHTTP.4.0',
                   'MSXML2.XMLHTTP.3.0',  'MSXML2.XMLHTTP',
                   'MICROSOFT.XMLHTTP.1.0',
                   'MICROSOFT.XMLHTTP.1', 'MICROSOFT.XMLHTTP'];
    for (var i = 0, len = indeces.length; i < len; i++) {
      try {
        ajaxRequest = new ActiveXObject(indeces[i]);
        break;
      } catch (exception) {

      }
    }
  }
  return ajaxRequest;
}

function fs_get_contents (pid, fname) {
	var sjax = fs_xhr();
	sjax.overrideMimeType( 'text/plain');
	sjax.open( "GET", fname, false);                             
	sjax.send( null);
	return sjax.responseText;
}

/////////////////////////////////// IO

var io_stdin  = 1;
var io_stdout = 2;
var io_stderr = 3;

var io_buffers;
var io_pipes;

var io_stdin_stack = [];
var io_stdin_reading = false;

function handle_prompt (evnt) {
	var input = '';
	if (evnt.keyCode !== 13) {
		return;
	}
	var x = document.getElementById('stdin-input').value;
	document.getElementById('stdin-input').value = '';
	io_stdin_callback( x);
	return false;
}

function io_stdin_callback (x) {
  if (io_stdin_stack.length === 1) {
    document.getElementById('stdin-input').style.display = 'none';
    io_stdin_reading = false;
  }
  io_stdin_stack.pop()(x);
}

// If file is stdin, stdin will send one line of string, minus the \n
function io_get (pid, file, cback) {
  if (file === io_stdin) {
    io_stdin_stack.push(cback)
    if (!io_stdin_reading) {
      io_stdin_reading = true;
      document.getElementById('stdin-input').style.display = '';
      document.getElementById('stdin-input').focus();
    }
  }
}

function io_put (pid, file, datum) {
  if (file === io_stdout) {
    document.getElementById('stdout').innerHTML += datum;
  }
}

function io_get_args (pid) {
  return proc_table[pid][1];
}

function io_get_stdin (pid) {
  return proc_table[pid][2];
}

function io_get_stdout (pid) {
  return proc_table[pid][3];
}

function io_get_stderr (pid) {
  return proc_table[pid][4];
}

////////////////////////////// SYS

var sys_calls = {
  get_contents: fs_get_contents,
  check_term:   proc_check_term,
  spawn:        proc_spawn, // Allows the process to spawn children
  get_syscalls: sys_get_syscalls,
  get_args:     io_get_args,
  get_stdin:    io_get_stdin,
  get_stdout:   io_get_stdout,
  get_stderr:   io_get_stderr,
  // These take a FILE identifier of some sort and the kernel.
  get:          io_get, // Also takes a callback to be called when input is received.
  put:          io_put, // Also takes as input the datum to be sent.
  // Allows the process to ask for its resources to be cleaned up.
  // Unfortunately this cannot be determined by the kernel due to interval callbacks that may in use.
  exit:         proc_exit
};

// We should really cache this since it won't change.
function sys_get_syscalls (pid) {
  var ret = [];
  for (var it in sys_calls) {
    if (sys_calls.hasOwnProperty(it)) {
      ret.push(it);
    }
  }
  return ret;
}

function indexed (x) {
  var rv = [];
  for (var i = 0, len = x.length; i < len; ++i) {
    rv[i] = x[i];
  }
  return rv;
}

function sys_call (pid, c) {
  var mem = proc_get_mem(pid);
  if (!mem['req_' + c]) {
    return;
  }
  var ret = sys_calls[c].apply(null, [pid].concat(indexed(mem['args_' + c])));
  mem['req_' + c] = false;
  return ret;
}

//////////////////////////////// INIT

function init_end (s) {
  if (s == 0) {
    alert("terminated normally");
  } else {
    alert("error code: " + s);
  }
}

function init () {

  var colors = { fore: 'lime', back: 'black' };

  // Not sure if we need an env system
  var env = {
	  cd:             '/home/ali/',
	  home_directory: '/home/ali',
	  computer_name:  'ali-laptop',
	  user:           'ali',
	  has_root:       false, // purely aeshetic. its up to the server to know if we have root.
	  path:           '/usr/bin/'
  };

  document.body.innerHTML += '<div id="display"><div id="stdout"></div><div id="stdin"><input id="stdin-input"></div></div><div id="process"></div>';

  // Set up some defualt styles for the OS
  document.body.style.cursor          = 'text';
  document.body.style.color           = colors.fore;
  document.body.style.backgroundColor = colors.back;
  document.body.style.margin          = '0';

  document.getElementById('process').style.display = 'none';
  var disp = document.getElementById('display');
  var inp  = document.getElementById('stdin-input');

  disp.style.whiteSpace = 'nowrap';
  disp.style.fontFamily = 'Monospace';
	disp.style.fontSize   = '14px';
  disp.onclick          = function () { inp.focus(); };

  inp.style.display         = 'none';
  inp.onkeypress            = handle_prompt;
  inp.style.width           = '100%';
  inp.style.color           = colors.fore;
  inp.style.backgroundColor = colors.back;
  inp.style.border          = 'none';

  var init = "file:///home/ali/code/jinn/app/init.js";
  proc_spawn(null, fs_get_contents(null, init), [init], io_stdin, io_stdout, io_stderr, init_end);
}

window.onload = init;

