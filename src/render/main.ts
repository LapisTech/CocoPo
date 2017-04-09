class Main
{
	private msg: Message;
	private menu: InMenu;
	private url: HTMLInputElement;

	constructor()
	{

	}

	public init()
	{
		this.msg = new Message();
		this.menu = new InMenu( this.msg );

		const url = document.getElementById( 'url' );
		if ( url ) { this.url = <HTMLInputElement>url; }
		const webview = document.getElementById('webview');
		if ( !webview ){ return; }
		webview.addEventListener( 'new-window', ( e ) => { this.openURL( (<any>e).url ); });
		webview.addEventListener( 'dom-ready', () =>
		{
			const wb = (<any>webview);
			this.updateURLBar( wb.src );

			webview.addEventListener( 'did-start-loading', ( e ) =>
			{
				const url = wb.src;
				if ( this.isTwitterURL( url ) )
				{
					this.updateURLBar( url );
				} else
				{
					wb.stop();
					this.openURL( url );
				}
			} );

			(<any>webview).insertCSS( `html{font-size:10px;}
` );
		} );
//msg.send( 'resize', { width: 600, height: 400 } );
	}

	private isTwitterURL( url: string ): boolean
	{
		return url.match( /^https+:\/\/[^\/]*\.twitter.com\// ) !== null;
	}

	public openURL( url: string )
	{
		require( 'shell' ).openExternal( url );
	}

	public updateURLBar( url: string )
	{
		this.url.value = url;
	}

	public mainMenu()
	{
		this.menu.open();
	}
}

const main = new Main();

window.addEventListener( 'contextmenu', ( e ) =>
{
	e.preventDefault();
	main.mainMenu();
}, false );

document.addEventListener( 'DOMContentLoaded', () =>
{
	main.init();
}, false );
