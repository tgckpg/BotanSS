"use strict";

var EventArgs = require( "./EventArgs" );

class HttpRequestComplete extends EventArgs
{
	constructor( Response, ResponseData )
	{
		super();

		if( ResponseData === undefined )
		{
			this.statusCode = -1;
			this.Data = new Buffer( 0 );
		}
		else
		{
			this.statusCode = Response.statusCode;
			this.Data = ResponseData;
		}

		this.Response = Response;
	}

	get Headers()
	{
		return this.Response.headers;
	}

	get ResponseString()
	{
		return this.Data.toString( "utf-8" );
	}
}

module.exports = HttpRequestComplete;
