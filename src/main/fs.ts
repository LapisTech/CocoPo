import * as fs   from 'fs';
import * as path from 'path';

class FileSystem
{
	public static loadFile( file: string ): Promise<string>
	{
		return new Promise( ( resolve, reject ) =>
		{
			fs.readFile( file, 'utf8', ( error, data ) =>
			{
				if ( error ) { return reject( error ); }
				resolve( data );
			} );
		} );
	}

	public static saveFile( file: string, data: string, sync: boolean = false )
	{
		if ( sync )
		{
			fs.writeFileSync( file, data );
			return Promise.resolve( {} );
		}

		return new Promise( ( resolve, reject ) =>
		{
			fs.writeFile( file, data, ( error ) =>
			{
				if ( error ) { return reject( error ); }
				resolve( {} );
			} );
		} );
	}

	public static existsDirectory( dir: string ): boolean
	{
		try
		{
			const stat = fs.statSync( dir );

			if ( stat && stat.isDirectory() ) { return true; }
		} catch( e ) {}
		return false;
	}

	public static makeDirectory( dir: string )
	{
		return new Promise( ( resolve, reject ) =>
		{
			fs.mkdir( dir, ( error: NodeJS.ErrnoException ) =>
			{
				if ( error && error.code !== 'EEXIST' )
				{
					return reject( { error: error } );
				}
				resolve( { exsists: !!error } );
			} );
		} );
	}

	public static readDirectory( dir: string )
	{
		return new Promise( ( resolve, reject ) =>
		{
			// Read theme directory.
			// Return directory list.
			fs.readdir( dir, ( error, dirs ) =>
			{
				if ( error ) { return resolve( [] ); }
				resolve( <string[]>dirs.filter( ( item ) =>
				{
					if( item.match( /^\./ ) ) { return false; }
					return FileSystem.existsDirectory( path.join( dir, item ) );
				} ) );
			} );
		} );
	}
}

export = FileSystem;
