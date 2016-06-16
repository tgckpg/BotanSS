"use strict";

var qstr = require( "querystring" );
var EventArgs = require( "./EventArgs" );

class PostRequestEventArgs extends EventArgs
{
	constructor( QueryString )
	{
		super();
		this.Raw = QueryString;
	}

	get Data()
	{
		return qstr.parse( this.Raw );
	}
}

module.exports = PostRequestEventArgs;
