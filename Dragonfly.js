"use strict";
var util = require( "util" );

/*{{{ Private methods */
// Months
var mon = [ '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12' ];

function padZero( num )
{
	if( num < 10 ) return "0" + String( num );
	return String( num );
}

function logDate( date )
{
	return "[ " + date.getFullYear()
		+ "-" + mon[ date.getMonth() ]
		+ "-" + padZero( date.getDate() )
		+ " " + padZero( date.getHours() )
		+ ":" + padZero( date.getMinutes() )
		+ ":" + padZero( date.getSeconds() )
		+ " ] ";
}
/*}}}*/
// Logger
class Dragonfly
{
	// Static properties
	static get defaultSphere()
	{
		return this.__dsphere;
	}
	
	static set defaultSphere( v )
	{
		return this.__dsphere = Math.floor( v + 0 );
	}

	static get Spheres()
	{
		return {
			// Debug
			THERMO: 30
			// Inspect
			, STRATO: 20
			// Production
			, HYDRO: 10
			, LITHO: 0
		};
	}

	static get Visibility()
	{
		return {
			VISIBLE: 9
			, VH8: 8, VH7: 7, VH6: 6
			, HIDDEN: 5
			, HU4: 4, HU3: 3, HU2: 2
			, UNSEEN: 1
		};
	}

	constructor( logHandler )
	{
		this.currentSphere = Dragonfly.defaultSphere;
		this.Visibility = Dragonfly.Visibility;
		this.Spheres = Dragonfly.Spheres;

		// Bind prototype functions
		for( var i in Dragonfly.prototype )
		{
			Dragonfly[i] = this[i].bind( this );
		}

		var cluster = require( "cluster" );
		if( cluster.isMaster )
		{
			this.logHandler = logHandler || { write: console.log };
			this.messageBus = function( msg )
			{
				if( msg.cmd == "dragonLog" )
				{
					this.logHandler.write( msg.data );
				}
			}.bind( this );
		}
		else
		{
			this.logHandler = { write: function( e ) { process.send({ cmd: "dragonLog", data: e }); } };
		}

		var cluster = require("cluster");
		var tag = cluster.isMaster ? "M" : "S";
		this.ptag = "[ " + tag + ":" + process.pid + " ] ";

		this.Info( "Dragonfly ready.", Dragonfly.Visibility.VISIBLE );
	}

	Debug( mesg, visibility )
	{
		this.Log( mesg, Dragonfly.Spheres.THERMO, visibility );
	}

	Info( mesg, visibility )
	{
		this.Log( mesg, Dragonfly.Spheres.STRATO, visibility );
	}

	Warning( mesg, visibility )
	{
		this.Log( mesg, Dragonfly.Spheres.HYDRO, visibility );
	}

	Error( mesg, visibility )
	{
		this.Log( mesg, Dragonfly.Spheres.LITHO, visibility );
	}

	Log( mesg, sphere, visibility )
	{
		if( isNaN( sphere ) ) sphere = Dragonfly.Spheres.LITHO;

		visibility = Number( visibility );
		isNaN( visibility ) && ( visibility = 0 );

		sphere += visibility;

		var write = true;
		if( this.currentSphere < sphere )
		{
			write = ( this.currentSphere % 10 < sphere % 10 );
		}

		if( write )
		{
			typeof( mesg ) == "function"
				? mesg( this.writeLine.bind( this ) )
				: this.writeLine( mesg )
				;
		}
	}

	writeLine ()
	{
		for( var i in arguments )
		{
			if( typeof( arguments[i] ) == "string" )
			{
				this.__log( arguments[i] );
			}
			else
			{
				var lines = util.inspect( arguments[i] ).split("\n");
				for( var j in lines )
				{
					this.__log( lines[j] );
				}
			}
		}
	}

	__log ( line )
	{
		this.logHandler.write( this.ptag + logDate( new Date() ) + util.format( line ) + "\n" );
	}
}

Dragonfly.defaultSphere = 10;

module.exports = Dragonfly;
