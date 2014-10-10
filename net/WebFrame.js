var Dragonfly = global.Dragonfly;
var FatalError = require( '../errors/FatalError.js' );

var Framework = function( garden )
{
	this.HTTP = garden;
	this.result = 0;
	this.planted = false;
	this.requestStr = "";
	this.requestObj = {};

	var Router = require( "./Router" );
	this.router = new Router( garden );
	this.router.addRoute( "404", false, "404" );

	this.handlers = {
		"404": function()
		{
			this.HTTP.response.statusCode = 404;
			this.result = "404 Not Found";
		}.bind( this )
	}
};

Framework.prototype.run = function()
{
	var _self = this;

	var method = "GET";
	if( this.HTTP.request.isPost )
	{
		this.HTTP.request.raw.addListener( "data", function( data )
		{
			_self.requestStr += data.toString();
		})
		this.HTTP.request.raw.addListener( "end", function()
		{
			_self.parseResult();
		});
		
		method = "POST";
	}

	Dragonfly.Info(
		method + ": " + encodeURI( this.HTTP.request.raw.url )
		+ " - " + this.HTTP.request.raw.headers["user-agent"]
		, Dragonfly.Visibility.VISIBLE
	);

	if( method == "GET" ) _self.parseResult();
};

Framework.prototype.addHandler = function( name, method )
{
	this.handlers[ name ] = method.bind( this );
};

Framework.prototype.parseResult = function()
{
	while( this.router.routable )
	{
		var method = this.router.route();
		if( method )
		{
			Dragonfly.Debug( "Call " + method );

			if( this.handlers[ method ] )
			{
				this.handlers[ method ]( this.router.routeObj );
				continue;
			}
		}

		throw new FatalError( "Relay handler \"" + method + "\" is not defined" );
	}

	this.plantResult();
};

Framework.prototype.plantResult = function()
{
	if( !this.planted )
	{
		this.planted = true;
		if( this.HTTP )
		{
			if( !( this.result instanceof Buffer ) )
			{
				this.result = String( this.result );
			}

			this.HTTP.response.headers["Content-Length"] = this.result.length;
			this.HTTP.response.write( this.result );
			this.HTTP.response.end();
		}

	}
};

module.exports = Framework;
