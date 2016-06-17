"use strict";

var cl = global.botanLoader;
var Dragonfly = global.Dragonfly;

var Cookie = cl.load( "botanss.net.components.Cookie" );

class CResponse
{
	constructor( res, Http )
	{
		this.raw = res;
		this.canExit = true;

		this.statusCode = 200;
		this.headers = {
			"Content-Type": "text/html; charset=utf-8"
			, "Powered-By": "Botanical Framework (Node.js)"
		};

		this.content = "";
		this.cookie = new Cookie( "", Http );
	}


	end()
	{
		if( this.canExit )
		{
			this.canExit = false;

			this.raw.writeHead( this.statusCode, this.headers );
			this.raw.end( this.content );
		}
	}

	write( str ) { this.content = str }
	writeLine( str ) { this.content += str + "\n"; }

}

class CRequest
{
	get isPost() { return this.raw.method == 'POST'; }
	get remoteAddr() { return this.raw.connection.remoteAddress; }

	constructor( req, Http )
	{
		this.raw = req;
		this.uri = require('url').parse( req.url );
		this.cookie = new Cookie( req.headers.cookie, Http );
	}
}

class Http
{
	constructor( req, res )
	{
		// Simple Http Model
		this.response = new CResponse( res, this );
		this.request = new CRequest( req, this );
	}
}

module.exports = Http;
