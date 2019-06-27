"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Main {
    constructor() {
    }
    init() {
        this.msg = new Message();
        this.menu = new InMenu();
        this.umenu = new UrlMenu();
        this.url = document.getElementById('url');
        this.menu.init(this.msg);
        this.umenu.init(this.url);
        this.initSetting();
        this.initWebView();
    }
    initSetting() {
        const page = document.getElementById('setting_page');
        const close = document.getElementById('close');
        AddClickEvent('close', () => { page.classList.add('hide'); });
        AddClickEvent('autoreload_update', () => {
            const toggle = document.getElementById('autoreload_toggle');
            this.msg.send('autoreload', toggle.classList.contains('on'));
        });
        AddClickEvent('autoreload_toggle', () => {
            const toggle = document.getElementById('autoreload_toggle');
            toggle.classList.toggle('on');
        });
        AddClickEvent('open_userdir', () => { this.msg.send('userdir', {}); });
        AddClickEvent('open_about', () => { this.msg.send('about', {}); });
        AddClickEvent('edit_theme', (e) => {
            HideElement('theme_editor', false);
            this.msg.send('get_theme', GetSelectedItem('themelist') || 'User');
        });
        this.msg.set('get_theme', (event, data) => {
            const cocopo = document.getElementById('edit_cocopo_theme');
            const twitter = document.getElementById('edit_twitter_style');
            if (cocopo) {
                cocopo.value = data.theme;
            }
            if (twitter) {
                twitter.value = data.style;
            }
        });
        AddClickEvent('save_theme', (e) => {
            const data = {
                target: GetSelectedItem('themelist'),
            };
            const cocopo = document.getElementById('edit_cocopo_theme');
            const twitter = document.getElementById('edit_twitter_style');
            if (cocopo) {
                data.theme = cocopo.value;
            }
            if (twitter) {
                data.style = twitter.value;
            }
            this.msg.send('save_theme', data);
        });
        this.msg.set('save_theme', (event, data) => {
            HideElement('theme_editor', true);
        });
        AddClickEvent('update_theme', () => {
            this.msg.send('update_theme', GetSelectedItem('themelist') || 'Default');
        });
        this.msg.set('update_theme', (event, data) => {
            alert('No update.');
        });
        AddClickEvent('install_theme', () => {
            const input = document.getElementById('install_url');
            const url = input.value;
            if (!url.match(/^https{0,1}\:\/\//)) {
                alert('This data is not URL.');
                return;
            }
            this.msg.send('install_theme', url);
        });
        this.msg.set('install_theme', (event, data) => {
            alert('Install error.');
        });
        AddClickEvent('select_theme', () => {
            this.msg.send('theme', GetSelectedItem('themelist') || 'Default');
        });
        AddClickEvent('setting', () => {
            HideElement(page, false);
            this.msg.send('setting', {});
        });
        this.msg.set('setting', (event, data) => {
            const select = document.getElementById('themelist');
            RemoveAllChildren(select);
            if (data.install) {
                alert('Install Success: ' + data.install);
            }
            const elms = {};
            elms['version'] = document.getElementById('theme_version');
            elms['author'] = document.getElementById('theme_author');
            elms['url'] = document.getElementById('theme_url');
            elms['info'] = document.getElementById('theme_info');
            elms['theme_name'] = document.getElementById('theme_name');
            elms['update'] = document.getElementById('update_theme');
            data.list.forEach((theme) => {
                const option = document.createElement('option');
                if (data.theme === theme.name) {
                    option.selected = true;
                    UpdateThemeInfo(elms, theme);
                }
                option.value = theme.name;
                option.text = theme.name;
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => {
                const num = e.target.selectedIndex;
                UpdateThemeInfo(elms, data.list[num]);
            }, false);
            const toggle = document.getElementById('frame');
            if (data.noframe) {
                toggle.classList.remove('on');
            }
            const input = document.getElementById('install_url');
            input.value = '';
        });
        AddClickEvent('frame', () => {
            const toggle = document.getElementById('frame');
            toggle.classList.toggle('on');
        });
        AddClickEvent('update_frame', () => {
            const toggle = document.getElementById('frame');
            this.msg.send('frame', !toggle.classList.contains('on'));
        });
    }
    initWebView() {
        const webview = document.getElementById('webview');
        webview.addEventListener('new-window', (e) => { this.openURL(e.url); });
        webview.addEventListener('dom-ready', () => {
            const wb = webview;
            this.updateURLBar(wb.src);
            webview.addEventListener('did-navigate-in-page', (e) => {
                const url = e.url;
                if (this.isTwitterURL(url)) {
                    this.updateURLBar(this.changeMobile(url));
                }
                else {
                    wb.stop();
                    this.openURL(url);
                }
            });
            this.msg.send('theme', '');
            this.msg.send('autoreload', undefined);
        });
        this.msg.set('theme', (event, data) => {
            if (data.update) {
                location.reload();
            }
            if (data.noframe) {
                document.body.classList.add('noframe');
            }
            webview.insertCSS(data.style);
            const theme = document.getElementById('theme');
            RemoveAllChildren(theme);
            theme.appendChild(document.createTextNode(data.theme));
        });
        this.msg.set('autoreload', (event, data) => {
            const toggle = document.getElementById('autoreload_toggle');
            toggle.classList[0 < data.result ? 'add' : 'remove']('on');
            this.initAutoUpdate(webview, data.result);
        });
    }
    initAutoUpdate(webview, time) {
        if (this.reloadtimer) {
            clearInterval(this.reloadtimer);
        }
        if (time <= 0) {
            return;
        }
        this.initScroll(webview);
        this.reloadtimer = setInterval(() => {
            if (this.url.value !== 'https://mobile.twitter.com/home') {
                return;
            }
            this.getScroll(webview).then((scroll) => {
                if (0 < scroll) {
                    return;
                }
                this.pushTwitterButton(webview, 1);
                this.pushTwitterButton(webview, 0);
                this.resetScroll(webview);
                setTimeout(() => {
                    this.checkScroll(webview).then((sclolled) => {
                        if (this.url.value !== 'https://mobile.twitter.com/home' || sclolled) {
                            return;
                        }
                        this.pushTwitterButton(webview, 0);
                    });
                }, 3000);
            });
        }, time * 1000);
    }
    execJSInWebView(webview, code) {
        return new Promise((resolve, reject) => {
            webview.executeJavaScript(code, false, (result) => {
                resolve(result);
            });
        });
    }
    initScroll(webview) {
        this.execJSInWebView(webview, 'typeof CocoPo;').then((type) => {
            if (type !== 'undefined') {
                return;
            }
            return this.execJSInWebView(webview, 'var CocoPo={scroll:false};document.addEventListener("wheel",()=>{CocoPo.scroll=true;});').then((type) => {
                console.log('Set scroll checker.');
            });
        });
    }
    getScroll(webview) {
        return this.execJSInWebView(webview, 'document.body.scrollTop;').then((scroll) => {
            if (typeof scroll === 'string') {
                scroll = parseInt(scroll);
            }
            if (typeof scroll !== 'number') {
                throw scroll;
            }
            return scroll;
        });
    }
    checkScroll(webview) {
        return this.execJSInWebView(webview, 'CocoPo.scroll;').then((scroll) => {
            return !!scroll;
        });
    }
    resetScroll(webview) {
        return this.execJSInWebView(webview, 'CocoPo.scroll=false;CocoPo.scroll;');
    }
    async pushTwitterButton(webview, button) {
        const selector = 'nav[role="navigation"]';
        const rect = await this.execJSInWebView(webview, `JSON.parse(JSON.stringify(document.querySelector('${selector}').getBoundingClientRect()));`);
        const x = rect.width / 2;
        const y = rect.top + rect.height / 18 * (1 + button * 2);
        webview.sendInputEvent({ type: 'mouseDown', x: x, y: y, button: 'left', clickCount: 1 });
        webview.sendInputEvent({ type: 'mouseUp', x: x, y: y, button: 'left', clickCount: 1 });
    }
    isTwitterURL(url) {
        return url.match(/^https+:\/\/[^\/]*\.twitter.com\//) !== null;
    }
    changeMobile(url) {
        return url.replace(/^https+:\/\/[^\/]*\.twitter.com\//, 'https://mobile.twitter.com/');
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
const electron = require('electron');
class MenuClass {
    constructor() {
        this.menu = new electron.remote.Menu();
    }
    addItem(label, click) {
        this.menu.append(new electron.remote.MenuItem({ label: label, click: click }));
    }
    open() {
        this.menu.popup({ window: electron.remote.getCurrentWindow() });
    }
}
class InMenu extends MenuClass {
    init(msg) {
        this.addItem('Reload', () => { location.reload(); });
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
        this.addItem('Copy URL', () => { this.copyUrl(); });
        this.addItem('Open URL', () => { this.openUrl(); });
        url.addEventListener('mousedown', (e) => {
            switch (e.button) {
                case 1:
                    break;
                case 2:
                    return this.open();
            }
        }, false);
    }
    copyUrl() {
        electron.clipboard.writeText(this.url.value);
    }
    openUrl() {
        electron.shell.openExternal(this.url.value);
    }
}
class Message {
    constructor() {
        this.events = {};
        electron.ipcRenderer.on('asynchronous-reply', (event, arg) => {
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
        electron.ipcRenderer.send('asynchronous-message', { type: type, data: data });
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
function RemoveAllChildren(e) {
    for (let child = e.lastChild; child; child = e.lastChild) {
        e.removeChild(child);
    }
}
function UpdateThemeInfo(elms, theme) {
    elms['version'].innerHTML = theme.version + '';
    elms['author'].innerHTML = theme.author;
    elms['url'].innerHTML = theme.url;
    elms['info'].innerHTML = theme.info;
    elms['theme_name'].innerHTML = theme.name || '';
    elms['update'].classList[theme.url ? 'remove' : 'add']('hide');
    HideElement('theme_editor', true);
}
function AddClickEvent(id, callback) {
    const e = document.getElementById(id);
    e.addEventListener('click', callback, false);
}
function _HideElement(e, hide) {
    e.classList[hide ? 'add' : 'remove']('hide');
}
function HideElement(id, hide) {
    if (typeof id !== 'string') {
        return _HideElement(id, hide);
    }
    const e = document.getElementById(id);
    _HideElement(e, hide);
}
function GetSelectedItem(id) {
    const select = document.getElementById(id);
    if (!select) {
        return '';
    }
    if (!select.selectedIndex || select.selectedIndex < 0) {
        select.selectedIndex = 0;
    }
    const selectedItem = select.options[select.selectedIndex];
    if (!selectedItem) {
        return '';
    }
    return selectedItem.value || '';
}
