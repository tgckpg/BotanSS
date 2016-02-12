"use strict";

class FatalError extends Error
{
	constructor( msg )
	{
		super( msg );
		this.name = "FatalError";
	}
}

module.exports = FatalError;
