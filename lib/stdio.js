
var line_feed = '\n';

// String output

function fprintc (el, text) {
	el.innerHTML = el.innerHTML + text;
	el.scrollTop = el.scrollHeight;
}

function html_clean (input) {
	input = input.replace( /&/, '&amp;');
	input = input.replace( /</, '&lt;');
	input = input.replace( />/, '&gt;');
	return input;
}

function printc (text) {
	if (typeof html_clean == 'string') {
		text = html_clean( text);
	}
	text = '<pre style="margin:0px;display:inline;">' + text + '</pre>';
	return fprintc( stdout, text);
}

function printl (text) {
	return printc( text + line_feed);
}

// print html
function printh (text) {
	return fprintc( stdout, text);
}

function perror (text) {
    return printl( text);
}

// String input

var prompt_count = 0;

function handle_prompt (handler, id, evnt) {
	var input = '';
	if (evnt.keyCode !== 13) {
		return;
	}
	input = gel( id).value;
	remove_prompt( id);
	handler( input);
	return false;
}

function create_prompt (handler) {
	var newid = 'prompt' + prompt_count;
	prompt_count = prompt_count + 1;
	printh( '<input type="text" style="padding:0;position:relative;right:1px;font-family:Monospace;font-size:14px;border:0;color:'+ rspace.colors.fore +';background-color:'+ rspace.colors.back +';" name="prompt" id="' + newid + '" size="80">');
	gel( newid).onkeypress = fill_arguments( handle_prompt, handler, newid);
	gel( newid).focus();
	++rspace.locks_in_progress.num;
}

function remove_prompt (id) {
	var el = gel( id);
	stdout.removeChild( el);
	--rspace.locks_in_progress.num;
}


window.onclick = function () {
    var p = rspace.document.getElementsByName( 'prompt');
    if (p[0]) {
	p[0].focus();
    }
};

