
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
    return (typeof addr.ptr_val == "undefined") ? memory.stack[addr] : addr.ptr_val;
}

// dref-set: sets value at address. (treats addr as an lval)
function ds (addr, val)
{
    if (typeof addr.ptr_val == 'undefined') {
	memory.stack[addr] = val;
    } else {
	addr.ptr_val = val;
    }
}

// address-of: finds the address associated with this name.
function a (name)
{
    return (typeof name == "string") ? memory.identifiers[name] : name;
}

// value-of: gets the value of this identifier
function v (name)
{
	return d( a( name));
}

