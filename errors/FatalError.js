function error( msg )
{
	this.name = "Fatal Error";
	this.message = msg;

	var e = new Error();
	e = e.stack.split( "\n" );
	e[0] = this.name;
	e[1] = "";

	this.stack = e.join( "\n" );
}

error.prototype.toString = function()
{
	return this.name + " " + this.message;
}

module.exports = error;
