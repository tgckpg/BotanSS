// The Package Loader

var fs = require( "fs" );
var rootNS = {
	botanss: "./"
};

var Package = function() { };

Package.prototype.rootNS = function( name, path )
{
	if( rootNS[ name ] ) return;
	rootNS[ name ] = fs.realpathSync( path ) + "/";
};

Package.prototype.load = function( _class )
{
	var fSep = _class.indexOf( "." );
	var nsdomain = _class.substr( 0, fSep );
	_class = _class.substr( fSep + 1 ).replace( /\./g, "/" );

	var file = rootNS[ nsdomain ] + _class;

	var lClass = require( file );
	// TODO: Implements filewatcher

	return lClass;
};

global.botanLoader = new Package();
