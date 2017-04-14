import fs = require( './fs' );

interface Config
{
	theme?: string,
	x?: number,
	y?: number,
	width?: number,
	height?: number,
	noframe?: boolean,
	top?: boolean,
}

class ConfigManager
{
	private file: string;

	private conf: Config = {};

	constructor( file: string )//App.getPath( 'userData' )
	{
		this.file = file;
	}

	public getTheme() { return this.conf.theme || 'Default'; }
	public setTheme( theme: string ) { this.conf.theme = theme; }

	public isNoframe() { return !!this.conf.noframe; }
	public setNoframe( noframe: boolean ) { this.conf.noframe = noframe; }

	public isAlwaysTop() { return !!this.conf.top; }
	public setAlwaysTop( top: boolean ) { this.conf.top = top; }

	public existsPosition() { return this.conf.x !== undefined && this.conf.y !== undefined; }
	public setPosition( x: number, y: number ) { this.conf.x = x; this.conf.y = y; }
	public getX() { return this.conf.x || 0; }
	public getY() { return this.conf.y || 0; }

	public existsSize() { return this.conf.width !== undefined && this.conf.height !== undefined; }
	public setSize( width: number, height: number ) { this.conf.width = width; this.conf.height = height; }
	public getWidth() { return this.conf.width || 0; }
	public getHeight() { return this.conf.height || 0; }

	public load(): Promise<Config>
	{
		return fs.loadFile( this.file ).then( ( data ): Promise<Config> =>
		{
			try
			{
				const conf = JSON.parse( data );
				if ( conf )
				{
					if ( typeof conf.theme !== 'string' )
					{
						conf.theme = 'Default';
					}
					if ( typeof conf.x !== 'number' || typeof conf.y !== 'number' )
					{
						delete conf.x;
						delete conf.y;
					}
					if ( typeof conf.width  !== 'number' || typeof conf.height !== 'number' )
					{
						delete conf.width;
						delete conf.height;
					}
					if ( typeof conf.noframe !== 'boolean' )
					{
						delete conf.noframe;
					}
					this.conf = conf;
					return Promise.resolve( <Config>conf );
				}
			}catch( e )
			{
				// TODO:
			}
			return Promise.reject( {} );
		} );
	}

	public save( sync: boolean = false )
	{
		const conf = this.conf;
		return fs.saveFile( this.file, JSON.stringify( conf ), sync );
	}
}

export = ConfigManager;