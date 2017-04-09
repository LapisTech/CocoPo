"use strict";
const electron = require("electron");
const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const IpcMain = electron.ipcMain;
let win;
console.log(process.versions);
function createWindow() {
    win = new BrowserWindow({
        width: 250,
        height: 480,
        frame: true,
        resizable: true,
        skipTaskbar: true,
    });
    win.setSkipTaskbar(true);
    win.setMenuBarVisibility(false);
    win.loadURL('file://' + __dirname + '/index.html');
    win.on('closed', () => {
    });
    createTasktray();
}
;
function createTasktray() {
    const trayIcon = new Tray(electron.nativeImage.createFromPath(__dirname + '/trayicon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open', click: () => { win.focus(); } },
        { label: 'Reset position', click: () => { win.center(); } },
        { label: 'Exit', click: () => { win.close(); } },
    ]);
    trayIcon.setContextMenu(contextMenu);
    trayIcon.setToolTip(App.getName());
    trayIcon.on('clicked', () => { win.focus(); });
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
const msg = new Message();
msg.set('resize', (event, data) => {
    if (!data || typeof data !== 'object') {
        event.sender.send('asynchronous-reply', { type: 'resixe', data: 'ng' });
        return;
    }
    win.setSize(data.width || 100, data.height || 180, false);
    event.sender.send('asynchronous-reply', { type: 'resixe', data: 'ok' });
});
msg.set('exit', (event, data) => {
    console.log("close");
    win.close();
});
App.on('ready', createWindow);
App.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        App.quit();
    }
});
App.on('activate', () => {
    if (!win) {
        createWindow();
    }
});
