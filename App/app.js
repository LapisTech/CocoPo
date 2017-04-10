class Main {
    constructor() {
    }
    init() {
        this.msg = new Message();
        this.menu = new InMenu(this.msg);
        const url = document.getElementById('url');
        if (url) {
            this.url = url;
        }
        const webview = document.getElementById('webview');
        if (!webview) {
            return;
        }
        webview.addEventListener('new-window', (e) => { this.openURL(e.url); });
        webview.addEventListener('dom-ready', () => {
            const wb = webview;
            this.updateURLBar(wb.src);
            webview.addEventListener('did-navigate-in-page', (e) => {
                const url = e.url;
                if (this.isTwitterURL(url)) {
                    this.updateURLBar(url);
                }
                else {
                    wb.stop();
                    this.openURL(url);
                }
            });
            this.msg.send('css', {});
        });
        this.msg.set('css', (event, data) => {
            webview.insertCSS(data);
        });
    }
    isTwitterURL(url) {
        return url.match(/^https+:\/\/[^\/]*\.twitter.com\//) !== null;
    }
    openURL(url) {
        electron.shell.openExternal(url);
    }
    updateURLBar(url) {
        this.url.value = url;
    }
    mainMenu() {
        this.menu.open();
    }
}
const main = new Main();
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    main.mainMenu();
}, false);
document.addEventListener('DOMContentLoaded', () => {
    main.init();
}, false);
const electron = require('electron');
class InMenu {
    constructor(msg) {
        this.menu = new electron.remote.Menu();
        this.addItem('Devtool', () => { this.devtool(); });
        this.menu.append(new electron.remote.MenuItem({ type: 'separator' }));
        this.addItem('Exit', () => { msg.send('exit', {}); });
    }
    addItem(label, click) {
        this.menu.append(new electron.remote.MenuItem({ label: label, click: click }));
    }
    devtool() {
        document.getElementById('webview').openDevTools();
    }
    open() {
        this.menu.popup(electron.remote.getCurrentWindow());
    }
}
const IpcRenderer = require('electron').ipcRenderer;
class Message {
    constructor() {
        this.events = {};
        IpcRenderer.on('asynchronous-reply', (event, arg) => {
            if (!this.events[arg.type]) {
                return;
            }
            this.events[arg.type](event, arg.data);
        });
    }
    set(type, func) {
        this.events[type] = func;
    }
    send(type, data) {
        IpcRenderer.send('asynchronous-message', { type: type, data: data });
    }
}
