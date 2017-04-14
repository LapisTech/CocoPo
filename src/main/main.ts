import * as electron from 'electron';
import * as path     from 'path';
import fs = require( './fs' );
import ConfigManager = require( './config' );
import ThemeManager = require( './theme' );

const PackageInfo = require( './package.json' );

const App           = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray          = electron.Tray;
const Menu          = electron.Menu;
const IpcMain       = electron.ipcMain;
const Dialog        = electron.dialog;

console.log( process.versions );
console.log( App.getPath( 'userData' ) );

class Main
{
	private msg: Message;
	private win: Electron.BrowserWindow;
	private tray: Electron.Tray;

	private config: ConfigManager;
	private theme: ThemeManager;

	constructor()
	{
		this.config = new ConfigManager( path.join( App.getPath( 'userData' ), 'config.json' ) );
		this.theme = new ThemeManager( path.join( App.getPath( 'userData' ), 'theme' ) );
	}

	public init()
	{
		this.config.load().catch( ( e ) =>
		{
			// Init config & Default style.
			return this.config.save().catch( () =>
			{
				return Promise.resolve( {} );
			} );
		} ).then( () =>
		{
			// Init theme 'Default'.
			return this.theme.init().catch( ( error ) =>
			{
				return Promise.resolve( {} );
			} );
		} ).then( () =>
		{
			// Load theme & style.
			return this.theme.load( this.config.getTheme(), true ).then( ( result ) =>
			{
				this.setMessage();
				this.createWindow();
				this.createTasktray();
				return Promise.resolve( {} );
			} );
		} );
	}

	public existWindow(): boolean { return !!this.win; }

	private setMessage()
	{
		this.msg = new Message();

		this.msg.set( 'userdir', ( event, data ) =>
		{
			electron.shell.openExternal( App.getPath( 'userData' ) );
		} );

		this.msg.set( 'about', ( event, data ) => { this.about(); } );

		this.msg.set( 'get_theme', ( event, data ) =>
		{
			this.theme.load( <string>data ).then( ( result ) =>
			{
				const data: Theme =
				{
					update: result.update,
					style: result.style,
					theme: result.theme,
					noframe: this.config.isNoframe(),
				};
				event.sender.send( 'asynchronous-reply',
				{
					type: 'get_theme',
					data: data
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

			return this.theme.saveTheme( data.target, data.style, data.theme ).then( () =>
			{
				event.sender.send( 'asynchronous-reply',
				{
					type: 'save_theme',
					data: { result: true }
				} );
			} );
		} );

		this.msg.set( 'update_theme', ( event, data ) =>
		{
			this.theme.check( <string>data ).then( ( data ) =>
			{
				return this.theme.downloadTheme( data ).then( () =>
				{
					return Promise.resolve( data );
				} );
			} ).then( ( data ) =>
			{
				const tdata: Theme =
				{
					update: true,
					style: this.theme.getNowStyle(),
					theme: this.theme.getNowTheme(),
					noframe: this.config.isNoframe(),
				};
				event.sender.send( 'asynchronous-reply',
				{
					type: 'theme',
					data: tdata,
				} );
			} ).catch( ( error ) =>
			{
				// No update.
				event.sender.send( 'asynchronous-reply',
				{
					type: 'update_theme',
					data: {}
				} );
			} );
		} );

		this.msg.set( 'install_theme', ( event, data ) =>
		{
			this.theme.downloadThemeInfo( <string>data ).then( ( data ) =>
			{
				return this.theme.downloadTheme( data ).then( () =>
				{
					return Promise.resolve( data );
				} );
			} ).then( ( data ) =>
			{
				const config: SettingData =
				{
					theme: this.config.getTheme(),
					list: [],
					noframe: this.config.isNoframe(),
					install: data.name,
				};

				this.theme.list().then( ( list ) =>
				{
					config.list = list;
					event.sender.send( 'asynchronous-reply',
					{
						type: 'setting',
						data: config,
					} );
				} );
			} ).catch( () =>
			{
				// Error.
				event.sender.send( 'asynchronous-reply',
				{
					type: 'install_theme',
					data: {}
				} );
			} );
		} );

		this.msg.set( 'theme', ( event, data ) =>
		{
			this.theme.load( <string>data, true ).then( ( result ) =>
			{
				if ( result.update )
				{
					this.config.setTheme( <string>data );
					this.config.save();
				}
				const tdata: Theme =
				{
					update: result.update,
					style: this.theme.getNowStyle(),
					theme: this.theme.getNowTheme(),
					noframe: this.config.isNoframe(),
				};
				event.sender.send( 'asynchronous-reply',
				{
					type: 'theme',
					data: tdata,
				} );
			} );
		} );

		this.msg.set( 'setting', ( event, data ) =>
		{
			const config: SettingData =
			{
				theme: this.config.getTheme(),
				list: [],
				noframe: this.config.isNoframe(),
				install: '',
			};

			this.theme.list().then( ( list ) =>
			{
				config.list = list;
				event.sender.send( 'asynchronous-reply',
				{
					type: 'setting',
					data: config,
				} );
			} );

		} );

		this.msg.set( 'frame', ( event, data ) =>
		{
			this.config.setNoframe( !!data );
			this.config.save().then( () =>
			{
				this.restart();
			} );
		} );

		this.msg.set( 'top', ( event, data ) =>
		{
			this.config.setAlwaysTop( !!data );
			this.win.setAlwaysOnTop( this.config.isAlwaysTop() );
			this.config.save();
		} );


		this.msg.set( 'exit', ( event, data ) =>
		{
			this.win.close();
		} );
	}

	private createWindow()
	{
		const option: Electron.BrowserWindowOptions =
		{
			width: 250,
			height: 480,
			frame: true,
			resizable: true,
			//nodeIntegration: false,
			//transparent: true,
			skipTaskbar: true,
		};

		if ( this.config.isNoframe() ) { option.frame = false; }

		if ( this.config.isAlwaysTop() ) { option.alwaysOnTop = true; }

		if ( this.config.existsPosition() )
		{
			option.x = this.config.getX();
			option.y = this.config.getY();
		}

		if ( this.config.existsSize() )
		{
			option.width = this.config.getWidth();
			option.height = this.config.getHeight();
		}

		this.win = new BrowserWindow( option );

		this.win.setMenuBarVisibility( false );

		this.win.loadURL( 'file://' + __dirname + '/index.html' );

		this.win.on( 'close', () =>
		{
			//win = null;
			const position = this.win.getPosition();
			this.config.setPosition( position[ 0 ], position[ 1 ] );

			const size = this.win.getSize();
			this.config.setSize( size[ 0 ], size[ 1 ] );

			this.config.save( true );
		} );

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
			buttons: [ 'OK', 'Site' ],
			message: PackageInfo.appname + ' versions.',
			detail: list.map( ( v ) => { return [ v.name, v.value ].join( ': ' ) } ).join( "\n" ),
		}, ( res ) =>
		{
			// res === 0 ... buttons[ 0 ] or Close button.
			if ( res === 1 )
			{
				// Open site.
				electron.shell.openExternal( PackageInfo.site );
			}
		} );
	}

	private restart()
	{
		App.relaunch();
		App.quit();
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
