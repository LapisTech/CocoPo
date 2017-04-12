import * as electron from 'electron';
import * as fs       from 'fs';
import * as path     from 'path';
const PackageInfo = require( './package.json' );

const App           = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray          = electron.Tray;
const Menu          = electron.Menu;
const IpcMain       = electron.ipcMain;
const Dialog        = electron.dialog;

console.log( process.versions );
console.log( App.getPath( 'userData' ) );

interface Config
{
	theme?: string,
}

class Main
{
	private msg: Message;
	private win: Electron.BrowserWindow;
	private tray: Electron.Tray;
	private conf: Config = {};
	private style: string = `
@media screen and (max-width: 300px) {
	html {
		font-size: 10px !important;
	}
}
body::-webkit-scrollbar
{
	overflow: hidden;
	width: 5px;
	background: #eee;
	-webkit-border-radius: 3px;
	border-radius: 3px;
}
body::-webkit-scrollbar:horizontal
{
	height: 5px;
}
body::-webkit-scrollbar-button
{
	display: none;
}
body::-webkit-scrollbar-piece
{
	background: #eee;
}
body::-webkit-scrollbar-piece:start
{
	background: #eee;
}
body::-webkit-scrollbar-thumb
{
	overflow: hidden;
	-webkit-border-radius: 3px;
	border-radius: 3px;
	background: #333;
}
body::-webkit-scrollbar-corner
{
	overflow:hidden;
	-webkit-border-radius: 3px;
	border-radius: 3px;
	background: #333;
}
`;
	private theme: string = '';

	public init()
	{
		this.loadConfig().then( ( data: Config ) =>
		{
			if ( !data.theme )
			{
				data.theme = 'Default';
				//return Promise.resolve( data );
			}

			// Load theme & style.
			return this.loadTheme( data.theme ).then( ( result ) =>
			{
				this.style = result.style;
				this.theme = result.theme;
				return Promise.resolve( data );
			} );
		} ).then( ( conf ) =>
		{
			this.conf = conf;
			this.setMessage();
			this.createWindow();
			this.createTasktray();
		} );
	}

	public existWindow(): boolean { return !!this.win; }

	private setMessage()
	{
		this.msg = new Message();

		this.msg.set( 'resize', ( event, data ) =>
		{
			if ( !data || typeof data !== 'object' )
			{
				event.sender.send( 'asynchronous-reply', { type: 'resixe', data: 'ng' } );
				return;
			}
			this.win.setSize( data.width || 100, data.height || 180, false );
			event.sender.send( 'asynchronous-reply', { type: 'resixe', data: 'ok' } );
		} );

		this.msg.set( 'get_theme', ( event, data ) =>
		{
			this.loadTheme( <string>data ).then( ( result ) =>
			{
				event.sender.send( 'asynchronous-reply',
				{
					type: 'get_theme',
					data: { style: result.style, theme: result.theme, update: result.update }
				} );
			} );
		} );

		this.msg.set( 'save_theme', ( event, data ) =>
		{
			if ( !data.target )
			{
				event.sender.send( 'asynchronous-reply',
				{
					type: 'save_theme',
					data: { result: false }
				} );
				return;
			}

			const dir = path.join( App.getPath( 'userData' ), 'theme', data.target );
			const p: Promise<{}>[] = [];

			if ( data.style )
			{
				p.push( this.saveFile( path.join( dir, 'style.css' ), data.style ).catch( () => { return Promise.resolve( {} ); } ) );
			}

			if ( data.theme )
			{
				p.push( this.saveFile( path.join( dir, 'theme.css' ), data.theme ).catch( () => { return Promise.resolve( {} ); } ) );
			}

			return Promise.all( p ).then( () =>
			{
				event.sender.send( 'asynchronous-reply',
				{
					type: 'save_theme',
					data: { result: true }
				} );
			} );
		} );

		this.msg.set( 'theme', ( event, data ) =>
		{
			this.loadTheme( <string>data ).then( ( result ) =>
			{
				this.style = result.style;
				this.theme = result.theme;
				if ( result.update )
				{
					this.conf.theme = <string>data;
					this.saveConfig();
				}
				event.sender.send( 'asynchronous-reply',
				{
					type: 'theme',
					data: { style: this.style, theme: this.theme, update: result.update }
				} );
			} );
		} );

		this.msg.set( 'setting', ( event, data ) =>
		{
			const config: SettingData =
			{
				theme: this.conf.theme || 'Default',
				list: [],
			};

			this.loadThemaList().then( ( list ) =>
			{
				config.list = list;
				event.sender.send( 'asynchronous-reply',
				{
					type: 'setting',
					data: config,
				} );
			} );

		} );

		this.msg.set( 'exit', ( event, data ) =>
		{
			this.win.close();
		} );
	}

	private createWindow()
	{
		this.win = new BrowserWindow(
		{
			width: 250,
			height: 480,
			frame: true,
			resizable: true,
			//nodeIntegration: false,
			//transparent: true,
			//alwaysOnTop: true,
			skipTaskbar: true,
		} );

		//win.setSkipTaskbar( true );

		this.win.setMenuBarVisibility( false );

		this.win.loadURL( 'file://' + __dirname + '/index.html' );

		this.win.on( 'closed', () =>
		{
			//win = null;
		} );

		/*
		let menu = Menu.buildFromTemplate([
		{
			label: 'Setting',
			click: function () {
				console.log("hoge");
			}
		} ]);
		Menu.setApplicationMenu(menu);
		*/
	}

	private createTasktray()
	{
		this.tray = new Tray( electron.nativeImage.createFromPath( __dirname + '/trayicon.png' ) );
		this.tray.setToolTip( 'CocoPo' );

		const contextMenu = Menu.buildFromTemplate(
		[
			{ label: 'Open', click: () => { this.win.focus(); } },
			{ label: 'Reset position', click: () => { this.win.center(); } },
			{ label: 'About', click: () => { this.about(); } },
			{ label: 'Exit', click: () => { this.win.close(); } },
		] );

		this.tray.setContextMenu( contextMenu );

		this.tray.setToolTip( App.getName() );

		this.tray.on( 'click', () => { this.win.focus(); } );
	}

	private loadFile( file: string ): Promise<string>
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

	private saveFile( file: string, data: string )
	{
		return new Promise( ( resolve, reject ) =>
		{
			fs.writeFile( file, data, ( error ) =>
			{
				if ( error ) { return reject( error ); }
				resolve( {} );
			} );
		} );
	}

	private loadConfig(): Promise<Config>
	{
		return this.loadFile( path.join( App.getPath( 'userData' ), 'config.json' ) ).then( ( data ) =>
		{
			try
			{
				const conf = JSON.parse( data );
				if ( conf )
				{
					return Promise.resolve( <Config>conf );
				}
			}catch( e )
			{
			}
			return Promise.reject( {} );
		} ).then( () =>
		{
			return this.initDefaultTheme();
		} ).catch( ( e ) =>
		{
			// Init config & Default style.
			const p =
			[
				this.initDefaultTheme().catch( () => { return Promise.resolve( {} ); } ),
				this.saveConfig().catch( () => { return Promise.resolve( {} ); } ),
			];
			return Promise.all( p ).then( () =>
			{
				return Promise.resolve( <Config>{} );
			} );
		} );
	}

	private saveConfig()
	{
		const conf = this.conf;
		return this.saveFile( path.join( App.getPath( 'userData' ), 'config.json' ), JSON.stringify( conf ) );
	}

	private makeDirectory( dir: string )
	{
		return new Promise( ( resolve, reject ) =>
		{
			fs.mkdir( dir, ( error: NodeJS.ErrnoException ) =>
			{
				if ( error && error.code !== 'EEXIST' ) { return reject( { error: error } ); }
				resolve( { exsists: !!error } );
			} );
		} );
	}

	private initDefaultTheme()
	{
		const sdir = path.join( App.getPath( 'userData' ), 'theme' );
		return this.makeDirectory( sdir ).then( () =>
		{
			const dir = path.join( sdir, 'Default' );
			return this.makeDirectory( dir ).then( () =>
			{
				const p =
				[
					this.makeDirectory( path.join( sdir, 'User' ) ),
					this.saveFile( path.join( dir, 'style.css' ), this.style ),
					this.saveFile( path.join( dir, 'theme.css' ), '' ),
				];
				return Promise.all( p );
			} );
		} );
	}

	private loadTheme( theme: string )
	{
		const data = { style: '', theme: '', update: true };

		const dir = path.join( App.getPath( 'userData' ), 'theme', theme );

		if ( !theme || !ExistsDirectory( dir ) )
		{
			return Promise.resolve( { style: this.style, theme: this.theme, update: false } );
		}

		const p =
		[
			this.loadFile( path.join( dir, 'style.css' ) ).then( ( style ) =>
			{
				data.style = style || '';
				return Promise.resolve( {} );
			} ).catch( () => { return Promise.resolve( {} ); } ),
			this.loadFile( path.join( dir, 'theme.css' ) ).then( ( style ) =>
			{
				data.theme = style || '';
				return Promise.resolve( {} );
			} ).catch( () => { return Promise.resolve( {} ); } ),
		];

		return Promise.all( p ).then( () =>
		{
			return Promise.resolve( data );
		} );
	}

	private loadThemaList(): Promise<ThemeData[]>
	{
		const sdir = path.join( App.getPath( 'userData' ), 'theme' );
		return new Promise( ( resolve, reject ) =>
		{
			// Read theme directory.
			// Return directory list.
			fs.readdir( sdir, ( error, dirs ) =>
			{
				if ( error ) { return resolve( [] ); }
				resolve( <string[]>dirs.filter( ( item ) =>
				{
					if( item.match( /^\./ ) ) { return false; }
					return ExistsDirectory( path.join( sdir, item ) );
				} ) );
			} );
		} ).then( ( list: string[] ) =>
		{
			// Read theme data list.
			const p: Promise<ThemeData>[] = [];
			list.forEach( ( thema ) =>
			{
				p.push( this.loadFile( path.join( sdir, thema, 'config.json' ) ).then( ( data ) =>
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

	private about()
	{
		const list: { name: string, value: string }[] =
		[
			{ name: 'Official Site', value: PackageInfo.site },
			{ name: 'Author', value: PackageInfo.author },
			{ name: PackageInfo.appname, value: PackageInfo.version },
			{ name: 'Electron', value: process.versions.electron },
			{ name: 'Node.js', value: process.versions.node },
			{ name: 'Chrome', value: process.versions.chrome },
			{ name: 'V8', value: process.versions.v8 },
		];
		Dialog.showMessageBox( this.win,
		{
			title: 'About',
			buttons: [ 'Site', 'OK' ],
			message: PackageInfo.appname + ' versions.',
			detail: list.map( ( v ) => { return [ v.name, v.value ].join( ': ' ) } ).join( "\n" ),
		}, ( res ) =>
		{
			if ( res === 0 )
			{
				// Open site.
				electron.shell.openExternal( PackageInfo.site );
			}
		} );
	}
}

class Message
{
	private eventsAsync: { [ keys: string ]: ( event: Electron.IpcMainEvent, arg: any ) => void };
	private eventsSync: { [ keys: string ]: ( event: Electron.IpcMainEvent, arg: any ) => void };

	constructor()
	{
		this.eventsAsync = {};
		this.eventsSync = {};

		IpcMain.on( 'asynchronous-message', ( event, arg: { type: string, data: any } ) =>
		{
			if ( !this.eventsAsync[ arg.type ] ) { return; }
			this.eventsAsync[ arg.type ]( event, arg.data );
			//event.sender.send( 'asynchronous-reply', '' );
		} );

		IpcMain.on( 'synchronous-message', ( event, arg ) =>
		{
			if ( !this.eventsSync[ arg.type ] ) { return; }
			this.eventsSync[ arg.type ]( event, arg.data );
			//event.returnValue = '';
		} );
	}

	public set( key: string, func: ( event: Electron.IpcMainEvent, arg: any ) => void, sync = false )
	{
		this[ sync ? 'eventsSync' : 'eventsAsync' ][ key ] = func;
	}
}

function ExistsDirectory( dir: string ): boolean
{
	try
	{
		const stat = fs.statSync( dir );

		if ( stat && stat.isDirectory() ) { return true; }
	} catch( e ) {}
	return false;
}

// ======================================== //
// Start                                    //
// ======================================== //

const main = new Main();

function init()
{
	main.init();
}

App.on( 'ready', init );

App.on( 'window-all-closed', () =>
{
	if ( process.platform != 'darwin' )
	{
		App.quit();
	}
} );

App.on( 'activate', () =>
{
	if ( !main.existWindow() ) { init(); }
} );
