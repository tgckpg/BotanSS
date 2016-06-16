"use strict";

var EventEmitter = require( "events" ).EventEmitter;

var http = require( "http" );
var https = require( "https" );

var CompleteEventArgs = require( "./events/HttpRequestComplete" );

class HttpRequest extends EventEmitter
{
	constructor( Url, Headers )
	{
		super();

		this.Secured = false;

		this.SetUrl( Url );

		this.Method = "GET";
		this.Headers = Headers || {
			"User-Agent": "BotanSS HttpRequest"
		};
	}

	SetUrl( Url )
	{
		var Match = Url.match( "^https?://" );
		if( !Match ) throw new Error( "Invalid Protocol" );
		switch( Match[0] )
		{
		case "http://":
			Url = Url.substr( 7 );
			this.Port = 80;
			break;
		case "https://":
			Url = Url.substr( 8 );
			this.Port = 443;
			this.Secured = true;
			break;
		}

		let slash =  Url.indexOf( "/" ) ;
		if( slash < 0 )
		{
			this.Path = "/";
			this.Hostname = Url;
		}
		else
		{
			this.Path = Url.substr( slash );
			this.Hostname = Url.substr( 0, slash );
		}
	}

	PostData( Data )
	{
		this.Method = "POST";
		this.Headers[ "Content-Type" ] = "application/x-www-form-urlencoded";
		this.RawPostData = new Buffer( Data );
		this.Headers[ "Content-Length" ] = this.RawPostData.length;
	}

	Send()
	{
		if( !this.Hostname ) throw new Error( "Url not set" );

		var req = ( this.Secured ? https : http )
			.request( this.Options, this.OnResponseReceived.bind( this ) );

		req.addListener( "error", ( err ) => {
			this.emit( "RequestComplete", this, new CompleteEventArgs( err ) )
		} );

		req.end( this.RawPostData );
	}

	get Options()
	{
		return {
			hostname: this.Hostname
			, port: this.Port
			, path: this.Path
			, method: this.Method
			, headers: this.Headers
		};
	}

	OnResponseReceived( Response )
	{
		var ResponseData = new Buffer( 0 );

		Response.addListener( "data", 
			Data => ResponseData = Buffer.concat([ ResponseData, Data ])
		);

		Response.addListener( "end", () => {
			this.emit( "RequestComplete"
				, this, new CompleteEventArgs( Response, ResponseData )
			);
		} );
	}
}

HttpRequest.HttpRequestCompleteEventArgs = CompleteEventArgs;

module.exports = HttpRequest;
