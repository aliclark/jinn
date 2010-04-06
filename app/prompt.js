
var count  = 0;
var format = "#num> ";

function stdget (cback) { get(get_stdin(),  cback); }
function stdput (datum) { put(get_stdout(), datum); }

function prompt_string () {
	var str = format;
	str = str.replace(/#num/, count);
  return str;

/*
	var str = format;
	str = str.replace(/#cd/, getenv('cd'));
	str = str.replace(getenv('home_directory'), '~');
	str = str.replace(/#user/, getenv('user'));
	str = str.replace(/#computer/, getenv('computer_name'));
	str = str.replace(/#num/, count);
	str = str.replace(/#is_root/, getenv('is_root') ? '#' : '$');
	return str;
*/
}

function command_fail () {
	++count;
	stdput("Error: Could not execute command.<br>\n");
	stdput(prompt_string());
	stdget(reader);
}

function program_exits (status) {
	++count;
	stdput(status + '<br>\n');
	stdput(prompt_string());
	stdget(reader);
}

function prog_name (input) {
  return input.split(' ')[0];
}

function prog_args (input) {
  return input.split(' ');
}

function reader (input) {
	stdput(input + ' <br>\n'); // the space is required where input=""
  var nme = prog_name(input);
  try {
    var code = get_contents(nme);
    spawn(code, prog_args(input), null, null, null, program_exits);
  } catch (e) {
    command_fail();
  }
}

function main () {
	stdput(prompt_string());
	stdget(reader);
}

