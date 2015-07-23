var WebParam = function( paramStr )
{
	var list = {};

	paramStr && paramStr.split( ";" ).forEach( function( param )
	{
		var parts = param.split( "=" );
		list[ parts.shift().trim() ] = decodeURI( parts.join( "=" ) );
	} );

	this.param = list;
};

WebParam.prototype.set = function( name, value )
{
	this.param[ name ] = value;
};

WebParam.prototype.get = function( name )
{
	return this.param[ name ];
};

WebParam.prototype.toString = function()
{
	var paramStr = "";
	for( var i in param )
	{
		paramStr += i + "=" + param[i] + ";";
	}
	return paramStr;
};

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
