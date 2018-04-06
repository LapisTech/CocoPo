class Main
{
	private msg: Message;
	private menu: InMenu;
	private umenu: UrlMenu;
	private url: HTMLInputElement;
	private reloadtimer: NodeJS.Timer;

	constructor()
	{
	}

	public init()
	{
		this.msg = new Message();
		this.menu = new InMenu();
		this.umenu = new UrlMenu();

		this.url = <HTMLInputElement>document.getElementById( 'url' );

		this.menu.init( this.msg );
		this.umenu.init( this.url );

		this.initSetting();

		this.initWebView();
	}

	private initSetting()
	{
		const page = <HTMLElement>document.getElementById( 'setting_page' );

		const close = <HTMLElement>document.getElementById( 'close' );
		AddClickEvent( 'close', () => { page.classList.add( 'hide' ); } );

		AddClickEvent( 'autoreload_update', () =>
		{
			const toggle = <HTMLElement>document.getElementById( 'autoreload_toggle' );
			this.msg.send( 'autoreload', toggle.classList.contains( 'on' ) );
		} );
		AddClickEvent( 'autoreload_toggle', () =>
		{
			const toggle = <HTMLElement>document.getElementById( 'autoreload_toggle' );
			toggle.classList.toggle( 'on' );
		} );

		AddClickEvent( 'open_userdir', () => { this.msg.send( 'userdir', {} ); } );
		AddClickEvent( 'open_about', () => { this.msg.send( 'about', {} ); } );

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

		AddClickEvent( 'update_theme', () =>
		{
			this.msg.send( 'update_theme', GetSelectedItem( 'themelist' ) || 'Default' );
		} );

		this.msg.set( 'update_theme', ( event, data ) =>
		{
			// No update.
			alert( 'No update.' );
		} );

		AddClickEvent( 'install_theme', () =>
		{
			const input = <HTMLInputElement>document.getElementById( 'install_url' );
			const url = input.value;
			if ( !url.match( /^https{0,1}\:\/\// ) )
			{
				alert( 'This data is not URL.' );
				return;
			}
			this.msg.send( 'install_theme', url );
		} );

		this.msg.set( 'install_theme', ( event, data ) =>
		{
			// Install Error.
			alert( 'Install error.' );
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
			RemoveAllChildren( select );

			if ( data.install )
			{
				alert( 'Install Success: ' + data.install );
			}

			const elms: { [ key: string ]: HTMLElement } = {};
			// Contents.
			elms[ 'version' ] = <HTMLElement>document.getElementById( 'theme_version' );
			elms[ 'author' ] = <HTMLElement>document.getElementById( 'theme_author' );
			elms[ 'url' ] = <HTMLElement>document.getElementById( 'theme_url' );
			elms[ 'info' ] = <HTMLElement>document.getElementById( 'theme_info' );
			elms[ 'theme_name' ] = <HTMLElement>document.getElementById( 'theme_name' );
			// Not contents.
			elms[ 'update' ] = <HTMLElement>document.getElementById( 'update_theme' );

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

			const toggle = <HTMLElement>document.getElementById( 'frame' );
			if ( data.noframe ) { toggle.classList.remove( 'on' ); }

			const input = <HTMLInputElement>document.getElementById( 'install_url' );
			input.value = '';
		} );

		AddClickEvent( 'frame', () =>
		{
			const toggle = <HTMLElement>document.getElementById( 'frame' );
			toggle.classList.toggle( 'on' );
		} );

		AddClickEvent( 'update_frame', () =>
		{
			const toggle = <HTMLElement>document.getElementById( 'frame' );
			this.msg.send( 'frame', !toggle.classList.contains( 'on' ) );
		} );

	}

	private initWebView()
	{

		const webview = <HTMLElement>document.getElementById( 'webview' );
		webview.addEventListener( 'new-window', ( e ) => { this.openURL( (<any>e).url ); });
		webview.addEventListener( 'dom-ready', () =>
		{
			const wb = (<any>webview);
			this.updateURLBar( wb.src );
			//webview.addEventListener( 'did-start-loading', ( e ) =>
			webview.addEventListener( 'did-navigate-in-page', ( e ) =>
			{
//console.log('did-navigate-in-page',e);
				const url = (<any>e).url;
				if ( this.isTwitterURL( url ) )
				{
					this.updateURLBar( this.changeMobile( url ) );
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
			this.msg.send( 'autoreload', undefined );
		} );

		this.msg.set( 'theme', ( event, data: Theme ) =>
		{
			if ( data.update ) { location.reload(); }
			if ( data.noframe ) { document.body.classList.add( 'noframe' ); }
			(<any>webview).insertCSS( data.style );
			const theme = <HTMLStyleElement>document.getElementById( 'theme' );
			RemoveAllChildren( theme );
			theme.appendChild( document.createTextNode( data.theme ) );
		} );

		this.msg.set( 'autoreload', ( event, data: { result: number } ) =>
		{
			const toggle = <HTMLElement>document.getElementById( 'autoreload_toggle' );
			toggle.classList[ 0 < data.result ? 'add' : 'remove' ]( 'on' );
			// Auto reload.
			this.initAutoUpdate( <any>webview, data.result );
		} );
	}

	private initAutoUpdate( webview: Electron.webContents, time: number )//TODO: webview
	{
		if ( this.reloadtimer )
		{
			clearInterval( this.reloadtimer );
		}
		if ( time <= 0 ) { return; }

		this.initScroll( webview );

		this.reloadtimer = setInterval( () =>
		{
			if ( this.url.value !== 'https://mobile.twitter.com/home' ) { return; }
			this.getScroll( webview ).then( ( scroll ) =>
			{
				if ( 0 < scroll ) { return; }
				// Reload.
				this.pushTwitterButton( webview, 1 );
				this.pushTwitterButton( webview, 0 );

				// Reset scroll.
				this.resetScroll( webview );

				// Move top.
				setTimeout( () =>
				{
					this.checkScroll( webview ).then( ( sclolled ) =>
					{
						if ( this.url.value !== 'https://mobile.twitter.com/home' || sclolled ) { return; }
						this.pushTwitterButton( webview, 0 );
					} );
				}, 3000 );
			} );
		}, time * 1000 );
	}

	private execJSInWebView( webview: Electron.webContents, code: string ): Promise<any>
	{
		return new Promise( ( resolve, reject ) =>
		{
			webview.executeJavaScript( code, false, ( result ) =>
			{
				resolve( result );
			} );
		} );
	}

	private initScroll( webview: Electron.webContents )
	{
		this.execJSInWebView( webview, 'typeof CocoPo;' ).then( ( type ) =>
		{
			if ( type !== 'undefined' ) { return; }
			return this.execJSInWebView( webview, 'var CocoPo={scroll:false};document.addEventListener("wheel",()=>{CocoPo.scroll=true;});' ).then( ( type ) =>
			{
				console.log( 'Set scroll checker.' );
			} );
		} );
	}

	private getScroll( webview: Electron.webContents )
	{
		return this.execJSInWebView( webview, 'document.body.scrollTop;' ).then( ( scroll ) =>
		{
			if ( typeof scroll === 'string' ) { scroll = parseInt( scroll ); }
			if ( typeof scroll !== 'number' ) { throw scroll; }
			return scroll;
		} );
	}

	private checkScroll( webview: Electron.webContents ): Promise<boolean>
	{
		return this.execJSInWebView( webview, 'CocoPo.scroll;' ).then( ( scroll ) =>
		{
			return !!scroll;
		} );
	}

	private resetScroll( webview: Electron.webContents )
	{
		return this.execJSInWebView( webview, 'CocoPo.scroll=false;CocoPo.scroll;' );
	}

	private pushTwitterButton( webview: Electron.webContents, button: number )
	{
		return this.execJSInWebView( webview, 'document.querySelector("header").clientHeight;' ).then( ( height ) =>
		{
			const x = (<any>webview).clientWidth / 8 * ( button * 2 + 1 );
			const y = height / 3 * 2;
			webview.sendInputEvent( <any>{ type: 'mouseDown', x: x, y: y, button:'left', clickCount: 1 } );
			webview.sendInputEvent( <any>{ type: 'mouseUp', x: x, y: y, button:'left', clickCount: 1 } );
		} );
	}

	private isTwitterURL( url: string )
	{
		return url.match( /^https+:\/\/[^\/]*\.twitter.com\// ) !== null;
	}

	private changeMobile( url: string )
	{
		return url.replace( /^https+:\/\/[^\/]*\.twitter.com\//, 'https://mobile.twitter.com/' );
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
	elms[ 'version' ].innerHTML = theme.version + '';
	elms[ 'author' ].innerHTML = theme.author;
	elms[ 'url' ].innerHTML = theme.url;
	elms[ 'info' ].innerHTML = theme.info;

	elms[ 'theme_name' ].innerHTML = theme.name || '';

	elms[ 'update' ].classList[ theme.url ? 'remove' : 'add' ]( 'hide' );

	HideElement( 'theme_editor', true );
}

function AddClickEvent( id: string, callback: ( this: HTMLElement, event: MouseEvent ) => void )
{
	const e = <HTMLElement>document.getElementById( id );
	e.addEventListener( 'click', callback, false );	
}

function _HideElement( e: HTMLElement, hide: boolean )
{
	e.classList[ hide ? 'add' : 'remove' ]( 'hide' );
}

function HideElement( id: string | HTMLElement, hide: boolean )
{
	if ( typeof id !== 'string' ) { return _HideElement( id, hide ); }
	const e = <HTMLElement>document.getElementById( id );
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
