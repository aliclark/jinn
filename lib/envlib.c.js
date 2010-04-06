
// This is envlib, my response to the C API.
// A fresh copy is imported to the namespace of all programs.
// This is the bread and butter of all applications, although it
// should be possible for applications to use kernel functions through
// some mechanism.
// The code must be run inside an iframe to work.

var parent_doc = (typeof parent == 'undefined') ? document : parent.document;
var stdout = document.body;
var stderr = document.body;
var stdin = '';
line_feed = '\n';

function gel (id)
{
	return parent_doc.getElementById( id);
}

// String output

function fprintc (el, text)
{
	el.innerHTML = el.innerHTML + text;
	el.scrollTop = el.scrollHeight;
}

function html_clean (input)
{
	input = input.replace(/&/, '&amp;');
	input = input.replace(/</, '&lt;');
	input = input.replace(/>/, '&gt;');
	return input;
}

function printc (text)
{
	if (typeof html_clean == 'string') {
		text = html_clean( text);
	}
	text = '<pre style="margin:0px;display:inline;">' + text + '</pre>';
	return fprintc( stdout, text);
}

// print html
function printh (text)
{
	return fprintc( stdout, text);
}

// String input

var prompt_count = 0;

function handle_prompt (handler, id, evnt)
{
	var input = '';
	if (evnt.keyCode !== 13) {
		return;
	}
	input = gel( id).value;
	remove_prompt( id);
	handler( input);
	return false;
}

function create_prompt (handler)
{
	var newid = 'prompt' + prompt_count;
	prompt_count = prompt_count + 1;
	printh( '<input type="text" style="border:0;width:100%;color:'+ parent.forecolor +';background-color:'+ parent.backcolor +';" name="prompt" id="' + newid + '">');
	gel( newid).onkeypress = fill_arguments( handle_prompt, handler, newid);
	gel( newid).focus();
	++parent.locks_in_progress;
}

function remove_prompt (id)
{
	var el = gel( id);
	stdout.removeChild( el);
	--parent.locks_in_progress;
}

// Environment

function system (cmd)
{
	return parent.eval( cmd);
}

function getenv (name)
{
	return parent.env[name];
}

// Memory.
// This is an attempt at providing pointer capabilities.
// The effect is achieved, with greater memory usage,
// but all "pointers" are global scope.

var memory = {
	identifiers: {},
	stack: []
};

// creates new identifier name to value val. Warning, this will always create a NEW identifier.
function s (name, val)
{
	var len = memory.stack.length;

	if (memory.identifiers[name] !== undefined) {
		return ds( a( name), val);
	}
	var len = memory.stack.length;
	memory.stack[len] = val;
	memory.identifiers[name] = len;
}

// dref: treats addr as an rval and gets its value.
function d (addr)
{
	return memory.stack[addr];
}

// dref-set: sets value at address. (treats addr as an lval)
function ds (addr, val)
{
	memory.stack[addr] = val;
}

// address-of: finds the address associated with this name.
function a (name)
{
	return memory.identifiers[name];
}

// value-of: gets the value of this identifier
function v (name)
{
	return d( a( name));
}




