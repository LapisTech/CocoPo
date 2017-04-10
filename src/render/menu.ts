const electron = require( 'electron' );

class InMenu
{
	private menu: Electron.Menu;

	constructor( msg: Message )
	{
		this.menu = new electron.remote.Menu();
		this.addItem( 'Devtool', () => { this.devtool(); } );
		this.menu.append( new electron.remote.MenuItem( { type: 'separator' } ) );
		this.addItem( 'Exit', () => { msg.send( 'exit', {} ); } );
	}

	public addItem( label: string, click: () => void )
	{
		this.menu.append( new electron.remote.MenuItem( { label: label, click: click } ) );
	}

	public devtool()
	{
		(<any>document.getElementById('webview')).openDevTools();
	}

	public open()
	{
		this.menu.popup( electron.remote.getCurrentWindow() );
	}
}
