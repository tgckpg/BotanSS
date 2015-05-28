var cl = global.botanLoader;
var Dragonfly = global.Dragonfly;

var FatalError = cl.load( "botanss.errors.FatalError" );

var Framework = function( garden )
{
	var _self = this;

	this.HTTP = garden;
	this.result = 0;
	this.planted = false;
	this.requestStr = "";
	this.requestObj = {};

	var Router = cl.load( "botanss.net.Router" );

	var router = new Router( garden );
	router.addRoute( "302", false, "302" );
	router.addRoute( "403", false, "403" );
	router.addRoute( "404", false, "404" );
	router.addRoute( "500", false, "500" );
	router.addListener( "Route", this.parseResult.bind( this ) );

	this.router = router;

	var res = this.HTTP.response;

	this.handlers = {
		"403": function()
		{
			res.statusCode = 403;
			_self.result = "403 Forbidden";
			_self.plantResult();
		}
		, "404": function()
		{
			res.statusCode = 404;
			_self.result = "404 Not Found";
			_self.plantResult();
		}
		, "302": function()
		{
			res.statusCode = 302;
			res.headers[ "Location" ] = router.relaying.params[0];
 
			_self.result = "";
			_self.plantResult();
		}
		, "500": function()
		{
			res.statusCode = 500;
			_self.result = "500 Internal Server Error";
			_self.plantResult();
		}
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
		( this.HTTP.request.raw.headers[ "x-forwarded-for" ] || this.HTTP.request.remoteAddr ) + " "
		+ method + ": " + encodeURI( this.HTTP.request.raw.url )
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
	if( this.router.routable )
	{
		var method = this.router.route();
		if( method )
		{
			Dragonfly.Debug( "Call " + method, Dragonfly.Spheres.THERMO );

			if( this.handlers[ method ] )
			{
				this.handlers[ method ]( this.router.routeObj );
				return;
			}
		}
		else if( method === false )
		{
			Dragonfly.Debug( "No route is defined to handle this URI", Dragonfly.Spheres.THERMO );
			this.router.routeObj.reRoute( "404", true );
			return;
		}

		throw new FatalError( "Relay handler \"" + method + "\" is not defined" );
	}

};

Framework.prototype.plantResult = function()
{
	if( this.planted ) return;

	this.planted = true;
	if( this.HTTP )
	{
		if( !( this.result instanceof Buffer ) )
		{
			this.result = new Buffer( this.result + "" );
		}

		this.HTTP.response.headers["Content-Length"] = this.result.length;
		this.HTTP.response.write( this.result );
		this.HTTP.response.end();
	}
};

// This won't handle path exists
// throwing an error is better than handling it
// Need to handle it somewhere else
Framework.prototype.plantFile = function( path, name )
{
	if( this.planted ) return;
	var _self = this;
	this.planted = true;

	var resp = this.HTTP.response;

	if( !name )
	{
		var p = require( "path" );
		name = p.basename( path );
	}

	resp.headers[ "Content-Disposition" ] = "attachment; filename=\"" + name + "\"";

	var fs = require( "fs" );

	Dragonfly.Debug( "Stream out: " + path );

	var rs = fs.createReadStream( path );
	rs.addListener( "data", ( x ) => resp.write( x ) );
	rs.addListener( "end", () => resp.end() );
};

module.exports = Framework;
