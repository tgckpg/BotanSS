"use strict";

const Dragonfly = global.Dragonfly;
const cl = global.botanLoader;

const Cookie = cl.load( "botanss.net.components.Cookie" );

class PageCache
{
	constructor()
	{
		this.cache = {};
		this.excepts = {};

		setInterval( () => {
			var d = new Date().getTime();
			for( var i in this.cache )
			{
				var c = this.cache[ i ];
				if( c.ttl < d ) delete this.cache[ i ];
			}

			for( var i in this.excepts )
			{
				var c = this.excepts[ i ];
				if( c.ttl < d ) delete this.excepts[ i ];
			}
		}, 30000 );
	}

	store( req, res, data, ttl )
	{
		if( !global.pagecache ) return;
		var key = req.url;

		var expires = new Date().getTime() + 1000 * ttl;

		var c = {
			data: data
			, headers: {
				"Content-Length": res.headers[ "Content-Length" ]
				, "Content-Type": res.headers[ "Content-Type" ]
				, "X-Cache-Expires": new Date( expires )
			}
			, statusCode: res.statusCode
			, ttl: expires
		};

		if( res.headers[ "Location" ] )
			c.headers[ "Location" ] = res.headers[ "Location" ];

		this.cache[ key ] = c;
		Dragonfly.Debug( "StoreCache: \"" + key + "\", expire " + new Date( expires ) );
	}

	except( sid, ttl )
	{
		if( !global.pagecache ) return;

		var expires = new Date().getTime() + 1000 * ttl;

		this.excepts[ sid ] = { ttl: expires };

		Dragonfly.Debug( "CacheExcept: \"" + sid.substr( 0, 8 ) + "\", expire " + new Date( expires ) );
	}

	process( req, res )
	{
		var cookie = new Cookie( req.headers.cookie );
		if( cookie.get( "sid" ) in this.excepts ) return false;

		var url = req.url;
		if( url in this.cache )
		{
			Dragonfly.Info(
				"[C] "
				+ ( req.headers[ "x-forwarded-for" ] || req.connection.remoteAddress ) + " "
				+ req.method + ": " + encodeURI( url )
				+ " - " + req.headers["user-agent"]
				, Dragonfly.Visibility.VISIBLE
			);

			var c = this.cache[ url ];
			res.writeHead( c.statusCode, c.headers );
			res.end( c.data );

			return true;
		}

		return false;
	}
}

module.exports = PageCache;
