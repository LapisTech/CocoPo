const electron = require( 'electron' );

class MenuClass
{
	protected menu: Electron.Menu;

	constructor()
	{
		this.menu = new electron.remote.Menu();
	}

	public addItem( label: string, click: () => void )
	{
		this.menu.append( new electron.remote.MenuItem( { label: label, click: click } ) );
	}

	public open()
	{
		this.menu.popup( electron.remote.getCurrentWindow() );
	}
}

class InMenu extends MenuClass
{
	public init( msg: Message )
	{
		this.addItem( 'Reload', () => { location.reload(); } );
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
}

class UrlMenu extends MenuClass
{
	private url: HTMLInputElement;

	public init( url: HTMLInputElement )
	{
		this.url = url;
		this.addItem( 'Copy', () => { this.copy(); } );

		url.addEventListener( 'mousedown', ( e ) =>
		{
			switch ( e.button )
			{
				//case 0: // Left
				case 1: // Middle
					break;
				case 2: // Right
					return this.open();
			}
		}, false );
	}

	public copy()
	{
		//this.menu.popup( electron.remote.getCurrentWindow() );
		electron.clipboard.writeText( this.url.value );
	}
}
