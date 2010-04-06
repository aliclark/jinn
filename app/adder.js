
function stdget (cback) { get(get_stdin(),  cback); }
function stdput (datum) { put(get_stdout(), datum); }

var number1;
var number2;

function numero_two (inp) {
	number2 = eval( inp);
	stdput( number2 + "<br>\nAnd we have... " + (number1 + number2) + ".<br>\n");
	exit( 0);
}

function numero_uno (inp) {
	number1 = eval( inp);
	stdput( number1 + "<br>\nNumero two: ");
	stdget( numero_two);
}

function main () {
	stdput( "Enter two numbers, and I'll try and add them!<br>\nNumero uno: ");
	stdget( numero_uno);
}

