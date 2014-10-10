function error( msg )
{
	this.name = "Internel Server Error";
	this.message = msg;
}

error.prototype.toString = function()
{
	return this.name + " " + this.message;
}

module.exports = error;
