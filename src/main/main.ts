import * as electron from 'electron';
const App           = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray          = electron.Tray;
const Menu          = electron.Menu;
const IpcMain       = electron.ipcMain;

let win: Electron.BrowserWindow;

console.log( process.versions );

function createWindow()
{
	win = new BrowserWindow(
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

	win.setSkipTaskbar( true );

	win.setMenuBarVisibility( false );

	win.loadURL( 'file://' + __dirname + '/index.html' );

	win.on( 'closed', () =>
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
		}
	]);
	Menu.setApplicationMenu(menu);
	*/

	createTasktray();
};

function createTasktray()
{
	const trayIcon = new Tray( electron.nativeImage.createFromPath( __dirname + '/trayicon.png' ) );

	const contextMenu = Menu.buildFromTemplate(
	[
		{ label: 'Open', click: () => { win.focus(); } },
		{ label: 'Reset position', click: () => { win.center(); } },
		{ label: 'Exit', click: () => { win.close(); } },
	] );

	trayIcon.setContextMenu( contextMenu );

	trayIcon.setToolTip( App.getName() );

	trayIcon.on( 'clicked', () => { win.focus(); } );
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

const msg = new Message();

msg.set( 'resize', ( event, data ) =>
{
	if ( !data || typeof data !== 'object' )
	{
		event.sender.send( 'asynchronous-reply', { type: 'resixe', data: 'ng' } );
		return;
	}
	win.setSize( data.width || 100, data.height || 180, false );
	event.sender.send( 'asynchronous-reply', { type: 'resixe', data: 'ok' } );
} );

msg.set( 'exit', ( event, data ) =>
{
	console.log("close");
	win.close();
} );

App.on( 'ready', createWindow );

App.on( 'window-all-closed', () =>
{
	if ( process.platform != 'darwin' )
	{
		App.quit();
	}
} );

App.on( 'activate', () =>
{
	if ( !win ) { createWindow(); }
} );
