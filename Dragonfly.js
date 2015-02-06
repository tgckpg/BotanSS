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
function Dragonfly( logHandler )
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
	this.ptag = "[ " + ( cluster.isMaster ? "M" : "S" ) + ":" + process.pid + " ] ";

	this.Info( "Dragonfly ready.", Dragonfly.Visibility.VISIBLE );
}

Dragonfly.prototype.Info = function( mesg, visibility )
{
	this.Log( mesg, Dragonfly.Spheres.THERMO, visibility );
};

Dragonfly.prototype.Warning = function( mesg, visibility )
{
	this.Log( mesg, Dragonfly.Spheres.STRATO, visibility );
};

Dragonfly.prototype.Error = function( mesg, visibility )
{
	this.Log( mesg, Dragonfly.Spheres.HYDRO, visibility );
};

Dragonfly.prototype.Debug = function( mesg, visibility )
{
	this.Log( mesg, Dragonfly.Spheres.LITHO, visibility );
};

Dragonfly.prototype.Log = function( mesg, sphere, visibility )
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
};

Dragonfly.prototype.writeLine = function ()
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
};

Dragonfly.prototype.__log = function ( line )
{
	this.logHandler.write( this.ptag + logDate( new Date() ) + util.format( line ) + "\n" );
};

// Static properties
Dragonfly.defaultSphere = 10;

Dragonfly.Spheres = {
	// Debug
	THERMO: 30
	// Inspect
	, STRATO: 20
	// Production
	, HYDRO: 10
	, LITHO: 0
};

Dragonfly.Visibility = {
	VISIBLE: 9
	, VH8: 8, VH7: 7, VH6: 6
	, HIDDEN: 5
	, HU4: 4, HU3: 3, HU2: 2
	, UNSEEN: 1
};

module.exports = Dragonfly;
