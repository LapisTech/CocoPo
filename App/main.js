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
        this.style = `
@media screen and (max-width: 300px) {
	html {
		font-size: 10px !important;
	}
}
body::-webkit-scrollbar {
	overflow: hidden;
	width: 5px;
	background: #eee;
	-webkit-border-radius: 3px;
	border-radius: 3px;
}
body::-webkit-scrollbar:horizontal {
	height: 5px;
}
body::-webkit-scrollbar-button {
	display: none;
}
body::-webkit-scrollbar-piece {
	background: #eee;
}
body::-webkit-scrollbar-piece:start {
	background: #eee;
}
body::-webkit-scrollbar-thumb {
	overflow: hidden;
	-webkit-border-radius: 3px;
	border-radius: 3px;
	background: #333;
}
body::-webkit-scrollbar-corner {
	overflow:hidden;
	-webkit-border-radius: 3px;
	border-radius: 3px;
	background: #333;
}
`;
        this.theme = '';
    }
    init() {
        this.loadConfig().then((data) => {
            if (!data.theme) {
                data.theme = 'Default';
            }
            return this.loadTheme(data.theme).then((result) => {
                this.style = result.style;
                this.theme = result.theme;
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
        this.msg.set('userdir', (event, data) => {
            electron.shell.openExternal(App.getPath('userData'));
        });
        this.msg.set('about', (event, data) => { this.about(); });
        this.msg.set('get_theme', (event, data) => {
            this.loadTheme(data).then((result) => {
                const data = {
                    update: result.update,
                    style: result.style,
                    theme: result.theme,
                    noframe: !!this.conf.noframe,
                };
                event.sender.send('asynchronous-reply', {
                    type: 'get_theme',
                    data: data
                });
            });
        });
        this.msg.set('save_theme', (event, data) => {
            if (!data.target) {
                event.sender.send('asynchronous-reply', {
                    type: 'save_theme',
                    data: { result: false }
                });
                return;
            }
            const dir = path.join(App.getPath('userData'), 'theme', data.target);
            const p = [];
            if (data.style) {
                p.push(this.saveFile(path.join(dir, 'style.css'), data.style).catch(() => { return Promise.resolve({}); }));
            }
            if (data.theme) {
                p.push(this.saveFile(path.join(dir, 'theme.css'), data.theme).catch(() => { return Promise.resolve({}); }));
            }
            return Promise.all(p).then(() => {
                event.sender.send('asynchronous-reply', {
                    type: 'save_theme',
                    data: { result: true }
                });
            });
        });
        this.msg.set('theme', (event, data) => {
            this.loadTheme(data).then((result) => {
                this.style = result.style;
                this.theme = result.theme;
                if (result.update) {
                    this.conf.theme = data;
                    this.saveConfig();
                }
                const tdata = {
                    update: result.update,
                    style: this.style,
                    theme: this.theme,
                    noframe: !!this.conf.noframe,
                };
                event.sender.send('asynchronous-reply', {
                    type: 'theme',
                    data: tdata,
                });
            });
        });
        this.msg.set('setting', (event, data) => {
            const config = {
                theme: this.conf.theme || 'Default',
                list: [],
                noframe: !!this.conf.noframe,
            };
            this.loadThemaList().then((list) => {
                config.list = list;
                event.sender.send('asynchronous-reply', {
                    type: 'setting',
                    data: config,
                });
            });
        });
        this.msg.set('frame', (event, data) => {
            this.conf.noframe = !!data;
            this.saveConfig().then(() => {
                this.restart();
            });
        });
        this.msg.set('top', (event, data) => {
            this.conf.top = !!data;
            this.win.setAlwaysOnTop(this.conf.top);
            this.saveConfig();
        });
        this.msg.set('exit', (event, data) => {
            this.win.close();
        });
    }
    createWindow() {
        const option = {
            width: 250,
            height: 480,
            frame: true,
            resizable: true,
            skipTaskbar: true,
        };
        if (this.conf.noframe) {
            option.frame = false;
        }
        if (this.conf.top) {
            option.alwaysOnTop = true;
        }
        if (this.conf.x !== undefined && this.conf.y !== undefined) {
            option.x = this.conf.x;
            option.y = this.conf.y;
        }
        if (this.conf.width !== undefined && this.conf.height !== undefined) {
            option.width = this.conf.width;
            option.height = this.conf.height;
        }
        this.win = new BrowserWindow(option);
        this.win.setMenuBarVisibility(false);
        this.win.loadURL('file://' + __dirname + '/index.html');
        this.win.on('close', () => {
            const position = this.win.getPosition();
            this.conf.x = position[0];
            this.conf.y = position[1];
            const size = this.win.getSize();
            this.conf.width = size[0];
            this.conf.height = size[1];
            this.saveConfig(true);
        });
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
                    if (typeof conf.theme !== 'string') {
                        conf.theme = 'Default';
                    }
                    if (typeof conf.x !== 'number' || typeof conf.y !== 'number') {
                        delete conf.x;
                        delete conf.y;
                    }
                    if (typeof conf.width !== 'number' || typeof conf.height !== 'number') {
                        delete conf.width;
                        delete conf.height;
                    }
                    if (typeof conf.noframe !== 'boolean') {
                        delete conf.noframe;
                    }
                    return Promise.resolve(conf);
                }
            }
            catch (e) {
            }
            return Promise.reject({});
        }).then((conf) => {
            return this.initDefaultTheme().then(() => {
                return Promise.resolve(conf);
            });
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
    saveConfig(sync = false) {
        const conf = this.conf;
        const file = path.join(App.getPath('userData'), 'config.json');
        if (sync) {
            fs.writeFileSync(file, JSON.stringify(conf));
            return Promise.resolve({});
        }
        return this.saveFile(file, JSON.stringify(conf));
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
                    this.makeDirectory(path.join(sdir, 'User')),
                    this.saveFile(path.join(dir, 'style.css'), this.style),
                    this.saveFile(path.join(dir, 'theme.css'), ''),
                ];
                return Promise.all(p);
            });
        });
    }
    loadTheme(theme) {
        const data = { style: '', theme: '', update: true };
        const dir = path.join(App.getPath('userData'), 'theme', theme);
        if (!theme || !ExistsDirectory(dir)) {
            return Promise.resolve({ style: this.style, theme: this.theme, update: false });
        }
        const p = [
            this.loadFile(path.join(dir, 'style.css')).then((style) => {
                data.style = style || '';
                return Promise.resolve({});
            }).catch(() => { return Promise.resolve({}); }),
            this.loadFile(path.join(dir, 'theme.css')).then((style) => {
                data.theme = style || '';
                return Promise.resolve({});
            }).catch(() => { return Promise.resolve({}); }),
        ];
        return Promise.all(p).then(() => {
            return Promise.resolve(data);
        });
    }
    loadThemaList() {
        const sdir = path.join(App.getPath('userData'), 'theme');
        return new Promise((resolve, reject) => {
            fs.readdir(sdir, (error, dirs) => {
                if (error) {
                    return resolve([]);
                }
                resolve(dirs.filter((item) => {
                    if (item.match(/^\./)) {
                        return false;
                    }
                    return ExistsDirectory(path.join(sdir, item));
                }));
            });
        }).then((list) => {
            const p = [];
            list.forEach((thema) => {
                p.push(this.loadFile(path.join(sdir, thema, 'config.json')).then((data) => {
                    try {
                        const config = JSON.parse(data);
                        if (typeof config !== 'object') {
                            return Promise.reject({});
                        }
                        return Promise.resolve(config);
                    }
                    catch (e) { }
                    return Promise.reject({});
                }).catch((error) => {
                    return Promise.resolve({});
                }).then((_data) => {
                    const data = _data;
                    if (!data.version) {
                        data.version = 0;
                    }
                    if (!data.name) {
                        data.name = thema;
                    }
                    if (!data.author) {
                        data.author = 'Unknown';
                    }
                    if (!data.url) {
                        data.url = '';
                    }
                    if (!data.info) {
                        data.info = '';
                    }
                    return Promise.resolve(data);
                }));
            });
            return Promise.all(p);
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
            buttons: ['OK', 'Site'],
            message: PackageInfo.appname + ' versions.',
            detail: list.map((v) => { return [v.name, v.value].join(': '); }).join("\n"),
        }, (res) => {
            if (res === 1) {
                electron.shell.openExternal(PackageInfo.site);
            }
        });
    }
    restart() {
        App.relaunch();
        App.quit();
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
function ExistsDirectory(dir) {
    try {
        const stat = fs.statSync(dir);
        if (stat && stat.isDirectory()) {
            return true;
        }
    }
    catch (e) { }
    return false;
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
