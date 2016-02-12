"use strict";

class WebParam
{
	constructor( paramStr )
	{
		var list = {};

		paramStr && paramStr.split( ";" ).forEach( function( param )
		{
			var parts = param.split( "=" );
			list[ parts.shift().trim() ] = decodeURI( parts.join( "=" ) );
		} );

		this.param = list;
	}

	set( name, value )
	{
		this.param[ name ] = value;
	}

	get( name )
	{
		return this.param[ name ];
	}

	toString()
	{
		var paramStr = "";
		for( var i in param )
		{
			paramStr += i + "=" + param[i] + ";";
		}
		return paramStr;
	}

}

WebParam.ExtractHeader = function( hstr )
{
	var headers = {};
	hstr.split( "\r\n" ).forEach( function( v )
	{
		if( !v ) return;
		var colx = v.indexOf( ':' );
		headers[ v.substring( 0, colx ) ] = new WebParam( v.substr( colx + 1 ) );
	} );

	return headers;
};

module.exports = WebParam;
