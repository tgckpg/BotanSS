var Dragonfly = global.Dragonfly;
var Cookie = require( "./Components/Cookie" );

var HTTP = function( req, res )
{
	var _self = this;
	var canExit = true;

	// Simple HTTP Model
	this.response = {
		statusCode: 200
		, headers: {
			"Content-Type": "text/html; charset=utf-8"
			, "Powered-By": "Botanical Framework (Node.js)"
		}
		, write: function( str ) { _self.response.content = str }
		, writeLine: function( str ) { _self.response.content += str + "\n"; }
		, end: function()
		{
			if( canExit )
			{
				canExit = false;

				var rc = _self.response;

				res.writeHead( rc.statusCode, rc.headers );
				res.end( rc.content );
			}
		}
		, content: ''
		, cookie: new Cookie( "", this )
		, raw: res
	};

	this.request = {
		uri: require('url').parse( req.url )
		, isPost: ( req.method == 'POST' )
		, cookie: new Cookie( req.headers.cookie, this )
		, remoteAddr: req.connection.remoteAddress
		, raw: req
	};

};


module.exports = HTTP;
