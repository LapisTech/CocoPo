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
			//webview.addEventListener( 'did-start-loading', ( e ) =>
			webview.addEventListener( 'did-navigate-in-page', ( e ) =>
			{
//console.log('did-navigate-in-page',e);
				const url = (<any>e).url;//wb.src;
				if ( this.isTwitterURL( url ) )
				{
					this.updateURLBar( url );
				} else
				{
					wb.stop();
					this.openURL( url );
				}
			} );
			//webview.addEventListener( 'did-start-loading', ( e ) =>{console.log('did-start-loading',e);});
			//webview.addEventListener( 'load-commit', ( e ) =>{console.log('load-commit',e);});
			//webview.addEventListener( 'did-get-redirect-request', ( e ) =>{console.log('did-get-redirect-request',e);});
			/*
			webview.addEventListener( 'did-finish-load', ( e ) =>{console.log('did-finish-load',e);});
			webview.addEventListener( 'did-fail-load', ( e ) =>{console.log('did-fail-load',e);});
			webview.addEventListener( 'did-frame-finish-load', ( e ) =>{console.log('did-frame-finish-load',e);});
			webview.addEventListener( 'did-stop-loading', ( e ) =>{console.log('did-stop-loading',e);});
			//webview.addEventListener( 'did-get-response-details', ( e ) =>{console.log('did-get-response-details',e);});
			webview.addEventListener( 'found-in-page', ( e ) =>{console.log('found-in-page',e);});
			webview.addEventListener( 'will-navigate', ( e ) =>{console.log('will-navigate',e);});
			webview.addEventListener( 'did-navigate', ( e ) =>{console.log('did-navigate',e);});
			webview.addEventListener( 'did-navigate-in-page', ( e ) =>{console.log('did-navigate-in-page',e);});
			webview.addEventListener( '', ( e ) =>{console.log('',e);});
			webview.addEventListener( '', ( e ) =>{console.log('',e);});
			webview.addEventListener( '', ( e ) =>{console.log('',e);});*/


			this.msg.send( 'css', {} );
		} );

		this.msg.set( 'css', ( event, data ) =>
		{
			(<any>webview).insertCSS( data );
		} );
	}

	private isTwitterURL( url: string ): boolean
	{
		return url.match( /^https+:\/\/[^\/]*\.twitter.com\// ) !== null;
	}

	public openURL( url: string )
	{
		electron.shell.openExternal( url );
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
