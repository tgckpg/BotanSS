var util = require('util');

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
function Dragonfly()
{
	// Static properties
	Dragonfly.currentSphere = 10;

	Dragonfly.Spheres = {
		THERMO: 30
		, STRATO: 20
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

	// Bind prototype functions
	for( var i in Dragonfly.prototype )
	{
		Dragonfly[i] = this[i].bind( this );
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
	if( Dragonfly.currentSphere < sphere )
	{
		write = ( Dragonfly.currentSphere % 10 < sphere % 10 );
	}

	// Writeline if yes
	write && this.writeLine( mesg );
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
	console.log( this.ptag + logDate( new Date() ) + line );
};

new Dragonfly();

global.Dragonfly = Dragonfly;
