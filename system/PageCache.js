"use strict";

const Dragonfly = global.Dragonfly;
const cl = global.botanLoader;

class PageCache
{
	constructor()
	{
		this.cache = { };
		setInterval( () => {
			var d = new Date().getTime();
			for( var i in this.cache )
			{
				var c = this.cache[ i ];
				if( c.ttl < d ) delete this.cache[ i ];
			}
		}, 30000 );
	}

	store( req, res, data, ttl )
	{
		if( !global.pagecache ) return;
		var key = req.url;

		var expires = new Date().getTime() + 1000 * ttl;

		this.cache[ key ] = {
			data: data
			, headers: {
				"Content-Length": res.headers[ "Content-Length" ]
				, "Content-Type": res.headers[ "Content-Type" ]
				, "X-Cache-Expires": new Date( expires )
			}
			, ttl: expires
		};

		Dragonfly.Debug( "StoreCache: \"" + key + "\", expire " + new Date( expires ) );
	}

	process( req, res )
	{
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
			res.headers = c.headers;
			res.write( c.data );
			res.end();
			return true;
		}

		return false;
	}
}

module.exports = PageCache;
