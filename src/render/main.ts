class Main
{
	private msg: Message;
	private menu: InMenu;
	private umenu: UrlMenu;
	private url: HTMLInputElement;

	constructor()
	{
	}

	public init()
	{
		this.msg = new Message();
		this.menu = new InMenu();
		this.umenu = new UrlMenu();

		const url = document.getElementById( 'url' );
		if ( url ) { this.url = <HTMLInputElement>url; }

		this.menu.init( this.msg );
		this.umenu.init( this.url );

		this.initSetting();

		this.initWebView();
	}

	private initSetting()
	{
		const page = document.getElementById( 'setting_page' );
		if ( !page ){ return; }

		const close = document.getElementById( 'close' );
		if ( !close ){ return; }
		AddClickEvent( 'close', () => { page.classList.add( 'hide' ); } );

		AddClickEvent( 'edit_theme', ( e ) =>
		{
			HideElement( 'theme_editor', false );
			this.msg.send( 'get_theme', GetSelectedItem( 'themelist' ) || 'User' );
		} );

		this.msg.set( 'get_theme', ( event, data ) =>
		{
			const cocopo = <HTMLTextAreaElement>document.getElementById( 'edit_cocopo_theme' );
			const twitter = <HTMLTextAreaElement>document.getElementById( 'edit_twitter_style' );

			if ( cocopo ) { cocopo.value = data.theme; }
			if ( twitter ) { twitter.value = data.style; }
		} );

		this.msg.set( 'get_theme', ( event, data ) =>
		{
			const cocopo = <HTMLTextAreaElement>document.getElementById( 'edit_cocopo_theme' );
			const twitter = <HTMLTextAreaElement>document.getElementById( 'edit_twitter_style' );

			if ( cocopo ) { cocopo.value = data.theme; }
			if ( twitter ) { twitter.value = data.style; }
		} );

		AddClickEvent( 'save_theme', ( e ) =>
		{
			const data: { target: string, theme?: string, style?: string } =
			{
				target: GetSelectedItem( 'themelist' ),
			};

			const cocopo = <HTMLTextAreaElement>document.getElementById( 'edit_cocopo_theme' );
			const twitter = <HTMLTextAreaElement>document.getElementById( 'edit_twitter_style' );

			if ( cocopo ) { data.theme = cocopo.value; }
			if ( twitter ) { data.style = twitter.value; }

			this.msg.send( 'save_theme', data );
		} );

		this.msg.set( 'save_theme', ( event, data ) =>
		{
			// TODO:
			HideElement( 'theme_editor', true );
		} );

		AddClickEvent( 'select_theme', () =>
		{
			this.msg.send( 'theme', GetSelectedItem( 'themelist' ) || 'Default' );
		} );

		AddClickEvent( 'setting', () =>
		{
			HideElement( page, false );
			this.msg.send( 'setting', {} );
		} );

		this.msg.set( 'setting', ( event, data: SettingData ) =>
		{
			const select = <HTMLSelectElement>document.getElementById( 'themelist' );
			if ( !select ) { return; }
			RemoveAllChildren( select );

			const elms: { [ key: string ]: HTMLElement } = {};
			// Contents.
			elms[ 'version' ] = <any>document.getElementById( 'theme_version' );
			elms[ 'author' ] = <any>document.getElementById( 'theme_author' );
			elms[ 'url' ] = <any>document.getElementById( 'theme_url' );
			elms[ 'info' ] = <any>document.getElementById( 'theme_info' );
			// Not contents.
			elms[ 'update' ] = <any>document.getElementById( 'update_theme' );

			data.list.forEach( ( theme ) =>
			{
				const option = document.createElement( 'option' );
				if ( data.theme === theme.name )
				{
					option.selected = true;
					UpdateThemeInfo( elms, theme );
				}
				option.value = theme.name;
				option.text = theme.name;
				select.appendChild( option );
			} );

			select.addEventListener( 'change', ( e ) =>
			{
				const num = (<HTMLSelectElement>e.target).selectedIndex;
				UpdateThemeInfo( elms, data.list[ num ] );
			}, false );
		} );
	}

	private initWebView()
	{

		const webview = document.getElementById( 'webview' );
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


			this.msg.send( 'theme', '' );
		} );

		this.msg.set( 'theme', ( event, data ) =>
		{
			if ( data.update ) { location.reload(); }
			(<any>webview).insertCSS( data.style );
			const theme = <HTMLStyleElement>document.getElementById( 'theme' );
			if ( !theme ) { return; }
			RemoveAllChildren( theme );
			theme.appendChild( document.createTextNode( data.theme ) );
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

	public urlMenu()
	{
		this.umenu.open();
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

function RemoveAllChildren( e: HTMLElement )
{
	for ( let child = e.lastChild ; child ; child = e.lastChild )
	{
		e.removeChild( child );
	}
}

function UpdateThemeInfo( elms: { [ keys: string ]: HTMLElement }, theme: ThemeData )
{
	if ( elms[ 'version' ] ) { elms[ 'version' ].innerHTML = theme.version + ''; }
	if ( elms[ 'author' ] ) { elms[ 'author' ].innerHTML = theme.author; }
	if ( elms[ 'url' ] ) { elms[ 'url' ].innerHTML = theme.url; }
	if ( elms[ 'info' ] ) { elms[ 'info' ].innerHTML = theme.info; }

	elms[ 'update' ].classList[ theme.url ? 'remove' : 'add' ]( 'hide' );

	HideElement( 'theme_editor', true );
}

function AddClickEvent( id: string, callback: ( this: HTMLElement, event: MouseEvent ) => void )
{
	const e = document.getElementById( id );
	if ( !e ){ return; }
	e.addEventListener( 'click', callback, false );	
}

function _HideElement( e: HTMLElement, hide: boolean )
{

	e.classList[ hide ? 'add' : 'remove' ]( 'hide' );
}

function HideElement( id: string | HTMLElement, hide: boolean )
{
	if ( typeof id !== 'string' ) { return _HideElement( id, hide ); }
	const e = document.getElementById( id );
	if ( !e ) { return; }
	_HideElement( e, hide );
}

function GetSelectedItem( id: string ): string
{
	const select = <HTMLSelectElement>document.getElementById( id );
	if ( !select ) { return ''; }
	if ( !select.selectedIndex || select.selectedIndex < 0 ) { select.selectedIndex = 0; }
	const selectedItem = <HTMLOptionElement>select.options[ select.selectedIndex ];
	if ( !selectedItem ) { return ''; }
	return selectedItem.value || '';
}