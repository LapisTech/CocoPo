import * as path     from 'path';
import * as http     from 'http';
import * as https    from 'https';
import fs = require( './fs' );

interface DownloadThemeData extends ThemeData
{
	twitter: string,
	cocopo: string,
}

class ThemeManager
{
	private style: string = `
header[role="banner"] > div { width: 20px; }
header[role="banner"] > div > div > div { width: 20px; padding: 0; }
@media screen and (max-width: 300px) {
	html {
		font-size: 10px !important;
	}
}
body::-webkit-scrollbar {
	overflow: hidden;
	width: 5px;
	background: #eee;
	-webkit-border-radius: 3px;
	border-radius: 3px;
}
body::-webkit-scrollbar:horizontal {
	height: 5px;
}
body::-webkit-scrollbar-button {
	display: none;
}
body::-webkit-scrollbar-piece {
	background: #eee;
}
body::-webkit-scrollbar-piece:start {
	background: #eee;
}
body::-webkit-scrollbar-thumb {
	overflow: hidden;
	-webkit-border-radius: 3px;
	border-radius: 3px;
	background: #333;
}
body::-webkit-scrollbar-corner {
	overflow:hidden;
	-webkit-border-radius: 3px;
	border-radius: 3px;
	background: #333;
}
`;
	private theme: string = '';

	private dir: string;

	constructor( dir: string )
	{
		this.dir = dir;
	}

	public init()
	{
		return fs.makeDirectory( this.dir ).then( () =>
		{
			const dir = path.join( this.dir, 'Default' );
			return fs.makeDirectory( dir ).then( () =>
			{
				const p =
				[
					fs.makeDirectory( path.join( this.dir, 'User' ) ),
					fs.saveFile( path.join( dir, 'style.css' ), this.style ),
					fs.saveFile( path.join( dir, 'theme.css' ), '' ),
				];
				return Promise.all( p );
			} );
		} );
	}

	public getNowStyle() { return this.style; }
	//public setNowStyle( data: string ) { this.style = data; }
	public getNowTheme() { return this.theme; }
	//public setNowTheme( data: string ) { this.theme = data; }

	public saveTheme( name: string, style: string, theme: string )
	{
		const dir = path.join( this.dir, name );
		return fs.makeDirectory( dir ).then( () =>
		{
			const p =
			[
				fs.saveFile( path.join( dir, 'style.css' ), style ),
				fs.saveFile( path.join( dir, 'theme.css' ), theme ),
			];

			return Promise.all( p ).then( () =>{});
		} );
	}

	public load( theme: string, update: boolean = false )
	{
		const data = { style: '', theme: '', update: true };

		const dir = path.join( this.dir, theme );

		if ( !theme || !fs.existsDirectory( dir ) )
		{
			return Promise.resolve( { style: this.style, theme: this.theme, update: false } );
		}

		const p =
		[
			fs.loadFile( path.join( dir, 'style.css' ) ).then( ( style ) =>
			{
				data.style = style || '';
				return Promise.resolve( {} );
			} ).catch( () => { return Promise.resolve( {} ); } ),
			fs.loadFile( path.join( dir, 'theme.css' ) ).then( ( style ) =>
			{
				data.theme = style || '';
				return Promise.resolve( {} );
			} ).catch( () => { return Promise.resolve( {} ); } ),
		];

		return Promise.all( p ).then( () =>
		{
			if ( update )
			{
				this.style = data.style;
				this.theme = data.theme;
			}
			return Promise.resolve( data );
		} );
	}

	public list(): Promise<ThemeData[]>
	{
		return fs.readDirectory( this.dir ).then( ( list: string[] ) =>
		{
			// Read theme data list.
			const p: Promise<ThemeData>[] = [];
			list.forEach( ( thema ) =>
			{
				p.push( fs.loadFile( path.join( this.dir, thema, 'theme.json' ) ).then( ( data ) =>
				{
					try
					{
						const config = JSON.parse( data );
						if ( typeof config !== 'object' ) { return Promise.reject( {} ); }
						return Promise.resolve( config );
					} catch( e ) {}
					return Promise.reject( {} );
				} ).catch( ( error ) =>
				{
					return Promise.resolve( {} );
				} ).then( ( _data: any ) =>
				{
					const data: ThemeData = <ThemeData>_data;

					if ( !data.version ) { data.version = 0; }
					if ( !data.name ) { data.name = thema; }
					if ( !data.author ) { data.author = 'Unknown'; }
					if ( !data.url ) { data.url = ''; }
					if ( !data.info ) { data.info = ''; }

					return Promise.resolve( data );
				} ) );
			} );

			return Promise.all( p );
		} );
	}

	public check( theme: string ): Promise<DownloadThemeData>
	{
		return this.loadThemeInfo( theme ).then( ( local ) =>
		{
			return this.downloadThemeInfo( local.url ).then( ( web ) =>
			{
				if ( web.version <= local.version ) { return Promise.reject( {} ); }
				return Promise.resolve( web );
			} );
		} );
	}

	private loadThemeInfo( theme: string ): Promise<ThemeData>
	{
		const dir = path.join( this.dir, theme );

		if ( !theme ) { return Promise.reject( {} ); }

		if ( !fs.existsDirectory( dir ) )
		{
			const data: ThemeData=
			{
				version: -1,
				name: theme,
				author: 'Unknown',
				url: '',
				info: '',
			};
			return Promise.resolve( data );
		}

		return fs.loadFile( path.join( dir, 'theme.json' ) ).then( ( result ): Promise<ThemeData> =>
		{
			try
			{
				const data = <ThemeData>JSON.parse( result );
				return Promise.resolve( data );
			} catch( e ) {}
			return Promise.reject( {} ); 
		} );
	}

	public downloadThemeInfo( url: string )
	{
		return Get( url ).then( ( result ): Promise<DownloadThemeData> =>
		{
			try
			{
				const data = <DownloadThemeData>JSON.parse( result );
				if (
					typeof data !== 'object' ||
					typeof data.version !== 'number' ||
					typeof data.name !== 'string' )
				{
					return Promise.reject( {} );
				}
				if ( typeof data.author !== 'string' ) { data.author = 'Unknown'; }
				if ( typeof data.info !== 'string' ) { data.info = ''; }
				if ( typeof data.twitter !== 'string' ) { data.twitter = 'style.css'; }
				if ( typeof data.cocopo !== 'string' ) { data.cocopo = 'theme.css'; }
				data.url = url;
				return Promise.resolve( data );
			} catch( e ) {}
			return Promise.reject( {} );
		} );
	}

	public downloadTheme( data: DownloadThemeData )
	{
		const baseurl = data.url.replace( /\/[^\/]*$/, '' ) + '/';
		const dir = path.join( this.dir, data.name );

		return fs.makeDirectory( dir ).then( () =>
		{
			const p =
			[
				Get( baseurl + data.twitter ).then( ( data ) =>
				{
					return fs.saveFile( path.join( dir, 'style.css' ), data );
				} ),
				Get( baseurl + data.cocopo ).then( ( data ) =>
				{
					return fs.saveFile( path.join( dir, 'theme.css' ), data );
				} ),
			];

			return Promise.all( p ).then( () =>
			{
				const json: ThemeData =
				{
					version: data.version,
					name: data.name,
					author: data.author,
					url: data.url,
					info: data.info,
				};
				return fs.saveFile( path.join( dir, 'theme.json' ), JSON.stringify( json ) );
			} ).catch( ( error ) =>
			{
				// TODO:
				return Promise.reject( error );
			} );
		} );
	}

}
function _Get( resolve: ( value?: {} | PromiseLike<{}> | undefined ) => void, reject: ( reason: any ) => void )
{
	return ( result: http.IncomingMessage ) =>
	{
		// TODO: check
		let body = '';
		result.setEncoding( 'utf8' );
		result.on( 'data', (chunk) => { body += chunk; } );
		result.on( 'end', () => { resolve( body ); } );
	}
}

function Get( url: string ): Promise<string>
{
	return new Promise( ( resolve, reject ) =>
	{
		let req: http.ClientRequest;

		if ( url.match( /^https\:\/\// ) )
		{
			req = https.get( <any>url, _Get( resolve, reject ) );// TODO: delete any.
		} else if ( url.match( /^http\:\/\// ) )
		{
			req = http.get( url, _Get( resolve, reject ) );
		} else { return reject( {} ); }

		req.on( 'error', ( error ) => { reject( error ); } );
	} );
}

export = ThemeManager;
