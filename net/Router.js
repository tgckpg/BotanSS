var Dragonfly = global.Dragonfly;

var util = require( "util" )
	, events = require( "events" )
	, FatalError = require( '../errors/FatalError.js' )
;

var MaxRedirect = 10;

var stripURI = function( url )
{
	return url.replace( /\/+/g, '/' ).replace( /^\//, '' );
};

var RelayPoint = function( uri, internal )
{
	this.direct = Boolean(
		typeof internal !== 'undefined' ? internal : false
	);

	this.value = internal ? uri : stripURI( uri );
};

var Router = function( http )
{
	events.EventEmitter.call( this );

	this.HTTP = http;
	this.routes = {};
	this.routable = true;
	this.redirect_count = 0;

	// Changed when routing
	this.inputs = [];
	this.routeObj = {};
	this.reRoute = false;

	this.relaying = new RelayPoint( http.request.raw.url );
};

util.inherits( Router, events.EventEmitter );

Router.prototype.addRoute = function( _name, _route, _action, _status )
{
	this.routes[ _name ] = {
		name: _name
		, route: _route
		, action: String( _action )
		, status: Boolean(
			typeof _status !== 'undefined' ? _status : true
		)
	};
};

Router.prototype.route = function()
{
	if( MaxRedirect < this.redirect_count )
		throw new FatalError( "Max redirection reached" );

	this.redirect_count ++;
	this.inputs[ this.inputs.length ] = this.relaying;

	var currentRoute = this.relaying.value;
	var r;

	if( this.relaying.direct )
	{
		if( r = this.routes[ this.relaying.value ] )
		{
			this.routable = false;
			this.setRoute( r );
			return r.action;
		}
	}
	else
	{
		for( var i in this.routes )
		{
			r = this.routes[i];
			if( r.route.constructor.prototype.exec )
			{
				var match = r.route.exec( currentRoute );
				if( match )
				{
					// Set routable to false
					this.routable = false;
					this.setRoute( r, match );
					return r.action;
				}
			}
		}
	}

	this.setRoute( "*", currentRoute );
	this.routable = false;
	return false;
};

// Set Route
Router.prototype.setRoute = function( _route, _match )
{
	this.routeObj = {
		route: _route
		, match: _match
		, router: this.router
		, inputs: this.inputs

		// Re-route function
		, reRoute: function( target, direct )
		{
			Dragonfly.Debug(
				"Reroute: " + target
				+ ( direct ? ", Direct" : "" )
			);
			this.relaying = new RelayPoint( target, direct );
			this.routable = true;
			this.reRoute = true;
			this.emit( "Route" );
		}.bind( this )
	};
};

module.exports = Router;
