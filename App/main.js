"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const PackageInfo = require('./package.json');
const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const IpcMain = electron.ipcMain;
const Dialog = electron.dialog;
console.log(process.versions);
console.log(App.getPath('userData'));
class Main {
    constructor() {
        this.conf = {};
        this.style = '@media screen and (max-width: 300px){html{font-size:10px !important;}}';
        this.theme = '';
    }
    init() {
        this.loadConfig().then((data) => {
            if (!data.theme) {
                data.theme = 'Default';
            }
            const p = [
                this.loadFile(path.join(App.getPath('userData'), 'theme', data.theme, 'style.css')).then((style) => {
                    this.style = style;
                    return Promise.resolve({});
                }).catch(() => { return Promise.resolve({}); }),
                this.loadFile(path.join(App.getPath('userData'), 'theme', data.theme, 'theme.css')).then((style) => {
                    this.theme = style;
                    return Promise.resolve({});
                }).catch(() => { return Promise.resolve({}); }),
            ];
            return Promise.all(p).then(() => {
                return Promise.resolve(data);
            });
        }).then((conf) => {
            this.conf = conf;
            this.setMessage();
            this.createWindow();
            this.createTasktray();
        });
    }
    existWindow() { return !!this.win; }
    setMessage() {
        this.msg = new Message();
        this.msg.set('resize', (event, data) => {
            if (!data || typeof data !== 'object') {
                event.sender.send('asynchronous-reply', { type: 'resixe', data: 'ng' });
                return;
            }
            this.win.setSize(data.width || 100, data.height || 180, false);
            event.sender.send('asynchronous-reply', { type: 'resixe', data: 'ok' });
        });
        this.msg.set('theme', (event, data) => {
            event.sender.send('asynchronous-reply', {
                type: 'theme',
                data: { css: this.style, theme: this.theme }
            });
        });
        this.msg.set('exit', (event, data) => {
            this.win.close();
        });
    }
    createWindow() {
        this.win = new BrowserWindow({
            width: 250,
            height: 480,
            frame: true,
            resizable: true,
            skipTaskbar: true,
        });
        this.win.setMenuBarVisibility(false);
        this.win.loadURL('file://' + __dirname + '/index.html');
        this.win.on('closed', () => {
        });
    }
    createTasktray() {
        this.tray = new Tray(electron.nativeImage.createFromPath(__dirname + '/trayicon.png'));
        this.tray.setToolTip('CocoPo');
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open', click: () => { this.win.focus(); } },
            { label: 'Reset position', click: () => { this.win.center(); } },
            { label: 'About', click: () => { this.about(); } },
            { label: 'Exit', click: () => { this.win.close(); } },
        ]);
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip(App.getName());
        this.tray.on('click', () => { this.win.focus(); });
    }
    loadFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf8', (error, data) => {
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }
    saveFile(file, data) {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, data, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve({});
            });
        });
    }
    loadConfig() {
        return this.loadFile(path.join(App.getPath('userData'), 'config.json')).then((data) => {
            try {
                const conf = JSON.parse(data);
                if (conf) {
                    return Promise.resolve(conf);
                }
            }
            catch (e) {
            }
            return Promise.reject({});
        }).catch((e) => {
            const p = [
                this.initDefaultTheme().catch(() => { return Promise.resolve({}); }),
                this.saveConfig().catch(() => { return Promise.resolve({}); }),
            ];
            return Promise.all(p).then(() => {
                return Promise.resolve({});
            });
        });
    }
    saveConfig() {
        const conf = this.conf;
        return this.saveFile(path.join(App.getPath('userData'), 'config.json'), JSON.stringify(conf));
    }
    makeDirectory(dir) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dir, (error) => {
                if (error && error.code !== 'EEXIST') {
                    return reject({ error: error });
                }
                resolve({ exsists: !!error });
            });
        });
    }
    initDefaultTheme() {
        const sdir = path.join(App.getPath('userData'), 'theme');
        return this.makeDirectory(sdir).then(() => {
            const dir = path.join(sdir, 'Default');
            return this.makeDirectory(dir).then(() => {
                const p = [
                    this.saveFile(path.join(dir, 'style.css'), this.style),
                    this.saveFile(path.join(dir, 'theme.css'), ''),
                ];
                return Promise.all(p);
            });
        });
    }
    about() {
        const list = [
            { name: 'Official Site', value: PackageInfo.site },
            { name: 'Author', value: PackageInfo.author },
            { name: PackageInfo.appname, value: PackageInfo.version },
            { name: 'Electron', value: process.versions.electron },
            { name: 'Node.js', value: process.versions.node },
            { name: 'Chrome', value: process.versions.chrome },
            { name: 'V8', value: process.versions.v8 },
        ];
        Dialog.showMessageBox(this.win, {
            title: 'About',
            buttons: ['Site', 'OK'],
            message: PackageInfo.appname + ' versions.',
            detail: list.map((v) => { return [v.name, v.value].join(': '); }).join("\n"),
        }, (res) => {
            if (res === 0) {
                electron.shell.openExternal(PackageInfo.site);
            }
        });
    }
}
class Message {
    constructor() {
        this.eventsAsync = {};
        this.eventsSync = {};
        IpcMain.on('asynchronous-message', (event, arg) => {
            if (!this.eventsAsync[arg.type]) {
                return;
            }
            this.eventsAsync[arg.type](event, arg.data);
        });
        IpcMain.on('synchronous-message', (event, arg) => {
            if (!this.eventsSync[arg.type]) {
                return;
            }
            this.eventsSync[arg.type](event, arg.data);
        });
    }
    set(key, func, sync = false) {
        this[sync ? 'eventsSync' : 'eventsAsync'][key] = func;
    }
}
const main = new Main();
function init() {
    main.init();
}
App.on('ready', init);
App.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        App.quit();
    }
});
App.on('activate', () => {
    if (!main.existWindow()) {
        init();
    }
});
