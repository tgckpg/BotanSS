var cl = global.botanLoader;
var Dragonfly = global.Dragonfly;

var domain = require('domain');

var FatalError = cl.load( "botanss.errors.FatalError" );

// Message is hardcoded to prevent further exceptions occured
// This function must be bug-free
function server500( response, e )
{
	response.statusCode = 500;
	response.setHeader( 'Content-Type', 'text/plain' );
	response.end( e.message || e );
}

function serverHandle( server, request, response, rHandle )
{
	var d = domain.create();

	d.addListener( 'error', function( e ) {
		Dragonfly.Error( e.stack );

		try
		{
			var killtimer = setTimeout( function()
			{
				process.exit(1);
			}, 3000);
			killtimer.unref();

			server.close();

			global.X_SERVER_CLUSTER.worker.destroy();

			server500( response, e );
		}
		catch( ex )
		{
			Dragonfly.Error( ex.stack );
			process.exit();
		}
	});

	d.add( request );
	d.add( response );

	d.run( function() {
		rHandle( request, response );
	});
}


// Construncor
function AppDomain( handler, port, cluster )
{
	var http = require( "http" );
	var server = http.createServer(
		function(req, res) {
			serverHandle( server, req, res, handler );
		}
	);

	server.listen( port );
	Dragonfly.Info( "Listening on: " + port, Dragonfly.Visibility.VISIBLE );
}


module.exports = AppDomain;
