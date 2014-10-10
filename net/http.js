var Dragonfly = global.Dragonfly;

var HTTP = function( req, res )
{
	var _self = this;
	var canExit = true;

	// Simple HTTP Model
	this.response = {
		statusCode: 200
		, headers: {
			"Content-Type": "text/html"
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
		, raw: res
	};

	this.request = {
		uri: require('url').parse( req.url )
		, isPost: ( req.method == 'POST' )
		, remoteAddr: req.connection.remoteAddress
		, raw: req
	};
};


module.exports = HTTP;
