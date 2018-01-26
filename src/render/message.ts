// TODO: Electron.IpcRendererEvent
interface IpcRendererEvent
{
	returnValue: any;
	sender:
	{
		send: ( channel: string, data: any ) => void,
	}
}
const IpcRenderer = require( 'electron' ).ipcRenderer;

class Message
{
	private events: { [ keys: string ]: ( event: /*Electron.*/IpcRendererEvent, arg: any ) => void };

	constructor()
	{
		this.events = {};
		IpcRenderer.on( 'asynchronous-reply', ( event: /*Electron.*/IpcRendererEvent, arg: { type: string, data: any } ) =>
		{
			if ( !this.events[ arg.type ] ) { return; }
			this.events[ arg.type ]( event, arg.data );
		} );
	}

	public set( type: string, func: ( event: /*Electron.*/IpcRendererEvent, arg: any ) => void )
	{
		this.events[ type ] = func;
	}

	public send( type: string, data: any )
	{
		IpcRenderer.send( 'asynchronous-message', { type: type, data: data } );
		//ipcRenderer.sendSync('synchronous-message', 'ping')
	}
}
