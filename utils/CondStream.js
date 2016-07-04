"use strict";

const Dragonfly = global.Dragonfly;

const fs = require( "fs" );
const path = require( "path" );
const crypto = require( "crypto" );

const ReadStream = require( "stream" ).Readable;

class ConditionalStream extends String
{
	constructor( tmpPath, triggerLimit )
	{
		super();

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
		if( this.stream )
		{
			this.stream.addListener( "close", () => {
				this.__finished = true;
				handler( this );
			} );
			this.stream.end();
		}
		else
		{
			setTimeout( () => {
				this.__finished = true;
				handler( this );
			} , 0 );
		}
	}

	discard()
	{
		this.__discard = true;
		if( this.__finished && this.file )
		{
			fs.unlink( this.file, ( e ) =>
			{
				Dragonfly.Debug( "Client Data Closed: " + this.file );
				if( this.__error ) throw new Error( this.__error );
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
		if( !this.__finished ) throw new Error( "Data is not finished yet" );
		if( this.__discard ) throw new Error( "Data is discarded" );

		if( this.stream )
		{
			var rt = fs.createReadStream( this.file );
			rt.addListener( "close", () => this.discard() );
			return rt;
		}

		var st = new ReadStream();
		st._read = function(){};

		setTimeout( () => {
			st.push( this.hexData, "hex" );
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
