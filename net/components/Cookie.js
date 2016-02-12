"use strict";

var cl = global.botanLoader;
var WebParam = cl.load( "botanss.utils.WebParam" );

class Cookie extends WebParam
{
	constructor( cookieStr, HTTP )
	{
		super( cookieStr );
		this.HTTP = HTTP;
	}

	seth( name, value )
	{
		this.set( name, value );
		this.HTTP.response.headers[ "Set-Cookie" ] = this.toString();
	}

	toString()
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
	}
}

module.exports = Cookie;
