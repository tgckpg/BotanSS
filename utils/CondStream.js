var fs = require( "fs" );
var crypto = require( "crypto" );
var util = require( "util" );
var ReadStream = require( "stream" ).Readable;

var ConditionalStream = function( tmpPath, triggerLimit )
{
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
};

util.inherits( ConditionalStream, String );


ConditionalStream.prototype.write = function( data )
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
		this.file = this.tmpPath + "ss_" + crypto.randomBytes( 8 ).toString( "hex" );
 
		this.stream = fs.createWriteStream( this.file );
		this.stream.addListener( "finish", this.__end.bind( this ) );
		this.stream.write( this.hexData, "hex" );
	}
};

ConditionalStream.prototype.end = function( handler )
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
};

ConditionalStream.prototype.discard = function()
{
	var _self = this;

	this.__discard = true;
	if( this.__finished )
	{
		fs.unlink( this.file, function()
		{
			if( _self.__error ) throw new Error( _self.__error );
		} );
	}
};

ConditionalStream.prototype.__end = function()
{
	this.__finished = true;
	if( this.__discard ) this.discard();
};

ConditionalStream.prototype.toString = function( enc )
{
	if( this.stream )
	{
		this.discard();
		this.__error = "Received data is too large to process";
	}

	return new Buffer( this.hexData, "hex" ).toString( enc );
};

ConditionalStream.prototype.resultStream = function()
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
};

module.exports = ConditionalStream;
