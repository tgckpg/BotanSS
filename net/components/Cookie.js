var cl = global.botanLoader;

var util = require( "util" );

var WebParam = cl.load( "botanss.utils.WebParam" );

var Cookie = function( cookieStr, HTTP )
{
	WebParam.call( this, cookieStr );
	this.HTTP = HTTP;
};

util.inherits( Cookie, WebParam );

Cookie.prototype.seth = function( name, value )
{
	this.set( name, value );
	this.HTTP.response.headers[ "Set-Cookie" ] = this.toString();
};

Cookie.prototype.toString = function()
{
	var cookieStr = "";
	var p = "";
	var e = "";
	for( var i in this.param )
	{
		switch( i.toLowerCase() )
		{
			case "path":
				p = this.param[i];
				continue;
			case "expires":
				e = this.param[i];
				continue;
		}
		cookieStr += i + "=" + this.param[i] + ";";
	}
	cookieStr += "Path=" + p + ";" + ( e ? ( " Expires=" + e + ";" ) : "" );
	return cookieStr;
};

module.exports = Cookie;
