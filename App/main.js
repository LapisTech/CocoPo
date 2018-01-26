"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const ConfigManager = require("./config");
const ThemeManager = require("./theme");
const PackageInfo = require('./package.json');
const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const IpcMain = electron.ipcMain;
const Dialog = electron.dialog;
console.log(process.versions);
console.log(App.getPath('userData'));
process.on('unhandledRejection', console.dir);
class Main {
    constructor() {
        this.config = new ConfigManager(path.join(App.getPath('userData'), 'config.json'));
        this.theme = new ThemeManager(path.join(App.getPath('userData'), 'theme'));
    }
    init() {
        return this.config.load().catch((e) => {
            return this.config.save().catch(() => {
                return Promise.resolve({});
            });
        }).then(() => {
            return this.theme.init().catch((error) => {
                return Promise.resolve({});
            });
        }).then(() => {
            return this.theme.load(this.config.getTheme(), true).then((result) => {
                this.setMessage();
                this.createWindow();
                this.createTasktray();
                return Promise.resolve({});
            });
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
            this.theme.load(data).then((result) => {
                const data = {
                    update: result.update,
                    style: result.style,
                    theme: result.theme,
                    noframe: this.config.isNoframe(),
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
            return this.theme.saveTheme(data.target, data.style, data.theme).then(() => {
                event.sender.send('asynchronous-reply', {
                    type: 'save_theme',
                    data: { result: true }
                });
            });
        });
        this.msg.set('update_theme', (event, data) => {
            this.theme.check(data).then((data) => {
                return this.theme.downloadTheme(data).then(() => {
                    return Promise.resolve(data);
                });
            }).then((data) => {
                const tdata = {
                    update: true,
                    style: this.theme.getNowStyle(),
                    theme: this.theme.getNowTheme(),
                    noframe: this.config.isNoframe(),
                };
                event.sender.send('asynchronous-reply', {
                    type: 'theme',
                    data: tdata,
                });
            }).catch((error) => {
                event.sender.send('asynchronous-reply', {
                    type: 'update_theme',
                    data: {}
                });
            });
        });
        this.msg.set('install_theme', (event, data) => {
            this.theme.downloadThemeInfo(data).then((data) => {
                return this.theme.downloadTheme(data).then(() => {
                    return Promise.resolve(data);
                });
            }).then((data) => {
                const config = {
                    theme: this.config.getTheme(),
                    list: [],
                    noframe: this.config.isNoframe(),
                    install: data.name,
                };
                this.theme.list().then((list) => {
                    config.list = list;
                    event.sender.send('asynchronous-reply', {
                        type: 'setting',
                        data: config,
                    });
                });
            }).catch(() => {
                event.sender.send('asynchronous-reply', {
                    type: 'install_theme',
                    data: {}
                });
            });
        });
        this.msg.set('theme', (event, data) => {
            this.theme.load(data, true).then((result) => {
                if (result.update) {
                    this.config.setTheme(data);
                    this.config.save();
                }
                const tdata = {
                    update: result.update,
                    style: this.theme.getNowStyle(),
                    theme: this.theme.getNowTheme(),
                    noframe: this.config.isNoframe(),
                };
                event.sender.send('asynchronous-reply', {
                    type: 'theme',
                    data: tdata,
                });
            });
        });
        this.msg.set('setting', (event, data) => {
            const config = {
                theme: this.config.getTheme(),
                list: [],
                noframe: this.config.isNoframe(),
                install: '',
            };
            this.theme.list().then((list) => {
                config.list = list;
                event.sender.send('asynchronous-reply', {
                    type: 'setting',
                    data: config,
                });
            });
        });
        this.msg.set('frame', (event, data) => {
            this.config.setNoframe(!!data);
            this.config.save().then(() => {
                this.restart();
            });
        });
        this.msg.set('top', (event, data) => {
            this.config.setAlwaysTop(!!data);
            this.win.setAlwaysOnTop(this.config.isAlwaysTop());
            this.config.save();
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
        if (this.config.isNoframe()) {
            option.frame = false;
        }
        if (this.config.isAlwaysTop()) {
            option.alwaysOnTop = true;
        }
        if (this.config.existsPosition()) {
            option.x = this.config.getX();
            option.y = this.config.getY();
        }
        if (this.config.existsSize()) {
            option.width = this.config.getWidth();
            option.height = this.config.getHeight();
        }
        this.win = new BrowserWindow(option);
        this.win.setMenuBarVisibility(false);
        this.win.loadURL('file://' + __dirname + '/index.html');
        this.win.on('close', () => {
            const position = this.win.getPosition();
            this.config.setPosition(position[0], position[1]);
            const size = this.win.getSize();
            this.config.setSize(size[0], size[1]);
            this.config.save(true);
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
