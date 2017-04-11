class Main {
    constructor() {
    }
    init() {
        this.msg = new Message();
        this.menu = new InMenu();
        this.umenu = new UrlMenu();
        const url = document.getElementById('url');
        if (url) {
            this.url = url;
        }
        this.menu.init(this.msg);
        this.umenu.init(this.url);
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
            this.msg.send('theme', {});
        });
        this.msg.set('theme', (event, data) => {
            webview.insertCSS(data.css);
            const theme = document.getElementById('theme');
            if (!theme) {
                return;
            }
            for (let child = theme.lastChild; child; child = theme.lastChild) {
                theme.removeChild(child);
            }
            theme.appendChild(document.createTextNode(data.theme));
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
    urlMenu() {
        this.umenu.open();
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
class MenuClass {
    constructor() {
        this.menu = new electron.remote.Menu();
    }
    addItem(label, click) {
        this.menu.append(new electron.remote.MenuItem({ label: label, click: click }));
    }
    open() {
        this.menu.popup(electron.remote.getCurrentWindow());
    }
}
class InMenu extends MenuClass {
    init(msg) {
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
}
class UrlMenu extends MenuClass {
    init(url) {
        this.url = url;
        this.addItem('Copy', () => { this.copy(); });
        url.addEventListener('mousedown', (e) => {
            switch (e.button) {
                case 1:
                    break;
                case 2:
                    return this.open();
            }
        }, false);
    }
    copy() {
        electron.clipboard.writeText(this.url.value);
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
