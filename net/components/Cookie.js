var encodeCookie = function( cookie )
{
	var cookieStr = "";
	var p = "";
	var e = "";
	for( var i in cookie )
	{
		switch( i.toLowerCase() )
		{
			case "path":
				p = cookie[i];
				continue;
			case "expires":
				e = cookie[i];
				continue;
		}
		cookieStr += i + "=" + cookie[i] + ";";
	}

	// Path at tail
	cookieStr += "Path=" + p + ";" + " Expires=" + e + ";";

	return cookieStr; 
};


var Cookie = function( cookieStr, HTTP )
{
	var list = {};

	cookieStr && cookieStr.split( ";" ).forEach( function( cookie )
	{
		var parts = cookie.split( "=" );
		list[ parts.shift().trim() ] = decodeURI( parts.join( "=" ) );
	} );

	this.__cookie = list;

	this.HTTP = HTTP;
};

Cookie.prototype.set = function( name, value )
{
	this.__cookie[ name ] = value;
};

Cookie.prototype.seth = function( name, value )
{
	this.set( name, value );
	this.HTTP.response.headers[ "Set-Cookie" ] = this.toString();
};

Cookie.prototype.get = function( name )
{
	return this.__cookie[ name ];
};

Cookie.prototype.toString = function()
{
	return encodeCookie( this.__cookie );
};


module.exports = Cookie;
