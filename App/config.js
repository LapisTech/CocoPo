"use strict";
const fs = require("./fs");
class ConfigManager {
    constructor(file) {
        this.conf = {};
        this.file = file;
    }
    getTheme() { return this.conf.theme || 'Default'; }
    setTheme(theme) { this.conf.theme = theme; }
    isNoframe() { return !!this.conf.noframe; }
    setNoframe(noframe) { this.conf.noframe = noframe; }
    isAlwaysTop() { return !!this.conf.top; }
    setAlwaysTop(top) { this.conf.top = top; }
    existsPosition() { return this.conf.x !== undefined && this.conf.y !== undefined; }
    setPosition(x, y) { this.conf.x = x; this.conf.y = y; }
    getX() { return this.conf.x || 0; }
    getY() { return this.conf.y || 0; }
    existsSize() { return this.conf.width !== undefined && this.conf.height !== undefined; }
    setSize(width, height) { this.conf.width = width; this.conf.height = height; }
    getWidth() { return this.conf.width || 0; }
    getHeight() { return this.conf.height || 0; }
    getAutoReloadTime() { return this.conf.autoreload || 0; }
    setAutoReloadTime(time = 0) {
        if (time < 0) {
            time = 0;
        }
        if (time && time < 60) {
            time = 60;
        }
        this.conf.autoreload = time;
    }
    load() {
        return fs.loadFile(this.file).then((data) => {
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
                    if (typeof conf.autoreload !== 'number' || conf.autoreload < 0) {
                        conf.autoreload = 0;
                    }
                    this.conf = conf;
                    return Promise.resolve(conf);
                }
            }
            catch (e) {
            }
            return Promise.reject({});
        });
    }
    save(sync = false) {
        const conf = this.conf;
        return fs.saveFile(this.file, JSON.stringify(conf), sync);
    }
}
module.exports = ConfigManager;
