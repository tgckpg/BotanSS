"use strict";
var Dragonfly = global.Dragonfly;

var fs = require( "fs" );
var path = require( "path" );
var crypto = require( "crypto" );

var ReadStream = require( "stream" ).Readable;

class ConditionalStream extends String
{
	constructor( tmpPath, triggerLimit )
	{
		super();
		// XXX: Dirty fix for incompat on node js v5
		Object.setPrototypeOf( this, new.target.prototype );

		if( !tmpPath )
		{
			throw new Error( "Temp path is not defined" );
		}

		this.size = 0;
		this.limit = triggerLimit * 1024;
		this.stream = false;
		this.hexData = "";
		this.tmpPath = tmpPath;

		this.file = false;

		this.__discard = false;

		this.__ended = false;
		this.__finished = false;
	}

	write( data )
	{
		var _self = this;
		this.size += data.length;

		if( this.stream )
		{
			this.hexData = false;
			this.stream.write( data );
			return;
		}

		this.hexData += data.toString( "hex" );

		// Trigger
		if( this.limit < this.size )
		{
			this.file = path.join( this.tmpPath, "ss_" + crypto.randomBytes( 8 ).toString( "hex" ) );
	 
			this.stream = fs.createWriteStream( this.file, { mode: "0600" } );
			this.stream.addListener( "finish", this.__end.bind( this ) );
			this.stream.write( this.hexData, "hex" );
		}
	}

	end( handler )
	{
		var _self = this;
		if( this.stream )
		{
			this.stream.addListener( "close", function() {
				_self.__finished = true;
				handler( _self );
			} );
			this.stream.end();
		}
		else
		{
			setTimeout( function()
			{
				_self.__finished = true;
				handler( _self )
			} , 0 );
		}
	}

	discard()
	{
		var _self = this;

		this.__discard = true;
		if( this.__finished && this.file )
		{
			fs.unlink( this.file, function( e )
			{
				Dragonfly.Debug( "Client Data Closed: " + _self.file );
				if( _self.__error ) throw new Error( _self.__error );
			} );
		}
	}

	toString( enc )
	{
		if( this.stream )
		{
			this.discard();
			this.__error = "Received data is too large to process";
		}

		return new Buffer( this.hexData, "hex" ).toString( enc );
	}

	resultStream()
	{
		var _self = this;
		if( !this.__finished ) throw new Error( "Data is not finished yet" );
		if( this.__discard ) throw new Error( "Data is discarded" );

		if( this.stream )
		{
			var rt = fs.createReadStream( this.file );
			rt.addListener( "close", () => _self.discard() );
			return rt;
		}

		var st = new ReadStream();
		st._read = function(){};

		setTimeout( function() {
			st.push( _self.hexData, "hex" );
			st.push( null );
		}, 0 );

		return st;
	}

	__end()
	{
		this.__finished = true;
		if( this.__discard ) this.discard();
	}
}

module.exports = ConditionalStream;
