"use strict";

const cl = global.botanLoader;
const Dragonfly = global.Dragonfly;
const PageCache = global.botanPageCache;

const CondStream = cl.load( "botanss.utils.CondStream" );
const FatalError = cl.load( "botanss.errors.FatalError" );

class WebFrame
{
	constructor( Http )
	{
		var _self = this;

		this.HTTP = Http;
		this.result = 0;
		this.planted = false;
		this.allowCache = true;
		this.requestStr = "";
		this.requestObj = {};

		var Router = cl.load( "botanss.net.Router" );

		var router = new Router( Http );
		router.addRoute( "301", false, "301" );
		router.addRoute( "302", false, "302" );
		router.addRoute( "403", false, "403" );
		router.addRoute( "404", false, "404" );
		router.addRoute( "500", false, "500" );
		router.addListener( "Route", this.__parse.bind( this ) );

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
			, "301": function()
			{
				res.statusCode = 301;
				res.headers[ "Location" ] = router.relaying.params[0];
				_self.result = "";
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
	}

	run()
	{
		var _self = this;

		var method = "GET";
		if( this.HTTP.request.isPost )
		{
			this.requestStr = new CondStream( "/tmp/", 2048 );

			this.HTTP.request.raw.addListener(
				"data" , ( x ) => _self.requestStr.write( x )
			);

			this.HTTP.request.raw.addListener(
				"end", () => _self.requestStr.end( () => _self.__parse() )
			);

			method = "POST";
		}

		var url = this.HTTP.request.raw.url;
		Dragonfly.Info(
			( this.HTTP.request.raw.headers[ "x-forwarded-for" ] || this.HTTP.request.remoteAddr ) + " "
			+ method + ": " + encodeURI( url )
			+ " - " + this.HTTP.request.raw.headers["user-agent"]
			, Dragonfly.Visibility.VISIBLE
		);

		if( method == "GET" )
		{
			this.queryStr = url.split( "?" )[1];
			this.__parse();
		}
	}

	addHandler( name, method )
	{
		this.handlers[ name ] = method.bind( this );
	}

	plantResult( cache, ttl )
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
			Dragonfly.Debug( "Result Planted" );

			this.__storeCache( cache, ttl );
		}

		// Release resources
		if( this.requestStr )
		{
			this.requestStr.discard();
		}
	}

	__storeCache( cache, ttl )
	{
		if( this.allowCache && cache && PageCache )
		{
			if( ttl == undefined ) ttl = 30;
			PageCache.store(
				this.HTTP.request.raw
				, this.HTTP.response
				, this.result
				, ttl
			);
		}
	}

	// This won't handle path exists
	// throwing an error is better than handling it
	// Need to handle it somewhere else
	plantFile( path, name )
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
	}

	__parse()
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
	}
}

module.exports = WebFrame;
