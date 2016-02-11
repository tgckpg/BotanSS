"use strict";

var EventEmitter = require( "events" ).EventEmitter;

var http = require( "http" );
var https = require( "https" );

class HttpRequestCompleteEventArgs
{
	constructor( ResponseData )
	{
		this.Data = ResponseData;
	}

	get ResponseString()
	{
		return this.Data.toString( "utf-8" );
	}
}

class HttpRequest extends EventEmitter
{
	constructor( Url, Headers )
	{
		super();

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

		var req = ( this.Port == 80 ? http : https )
			.request( this.Options, this.OnResponseReceived.bind( this ) );
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
		this.ResponseData = new Buffer( 0 );
		Response.addListener( "data", this.OnResponseData.bind( this ) );
		Response.addListener( "end", this.OnResponseComplete.bind( this ) );
	}

	OnResponseComplete()
	{
		this.emit( "RequestComplete"
			, this, new HttpRequestCompleteEventArgs( this.ResponseData ) );
	}

	OnResponseData( Data )
	{
		this.ResponseData = Buffer.concat([ this.ResponseData, Data ]);
	}
}

HttpRequest.HttpRequestCompleteEventArgs = HttpRequestCompleteEventArgs;

module.exports = HttpRequest;
