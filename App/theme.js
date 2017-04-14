"use strict";
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("./fs");
class ThemeManager {
    constructor(dir) {
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
        this.dir = dir;
    }
    init() {
        return fs.makeDirectory(this.dir).then(() => {
            const dir = path.join(this.dir, 'Default');
            return fs.makeDirectory(dir).then(() => {
                const p = [
                    fs.makeDirectory(path.join(this.dir, 'User')),
                    fs.saveFile(path.join(dir, 'style.css'), this.style),
                    fs.saveFile(path.join(dir, 'theme.css'), ''),
                ];
                return Promise.all(p);
            });
        });
    }
    getNowStyle() { return this.style; }
    getNowTheme() { return this.theme; }
    saveTheme(name, style, theme) {
        const dir = path.join(this.dir, name);
        return fs.makeDirectory(dir).then(() => {
            const p = [
                fs.saveFile(path.join(dir, 'style.css'), style),
                fs.saveFile(path.join(dir, 'theme.css'), theme),
            ];
            return Promise.all(p).then(() => { });
        });
    }
    load(theme, update = false) {
        const data = { style: '', theme: '', update: true };
        const dir = path.join(this.dir, theme);
        if (!theme || !fs.existsDirectory(dir)) {
            return Promise.resolve({ style: this.style, theme: this.theme, update: false });
        }
        const p = [
            fs.loadFile(path.join(dir, 'style.css')).then((style) => {
                data.style = style || '';
                return Promise.resolve({});
            }).catch(() => { return Promise.resolve({}); }),
            fs.loadFile(path.join(dir, 'theme.css')).then((style) => {
                data.theme = style || '';
                return Promise.resolve({});
            }).catch(() => { return Promise.resolve({}); }),
        ];
        return Promise.all(p).then(() => {
            if (update) {
                this.style = data.style;
                this.theme = data.theme;
            }
            return Promise.resolve(data);
        });
    }
    list() {
        return fs.readDirectory(this.dir).then((list) => {
            const p = [];
            list.forEach((thema) => {
                p.push(fs.loadFile(path.join(this.dir, thema, 'theme.json')).then((data) => {
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
    check(theme) {
        return this.loadThemeInfo(theme).then((local) => {
            return this.downloadThemeInfo(local.url).then((web) => {
                if (web.version <= local.version) {
                    return Promise.reject({});
                }
                return Promise.resolve(web);
            });
        });
    }
    loadThemeInfo(theme) {
        const dir = path.join(this.dir, theme);
        if (!theme) {
            return Promise.reject({});
        }
        if (!fs.existsDirectory(dir)) {
            const data = {
                version: -1,
                name: theme,
                author: 'Unknown',
                url: '',
                info: '',
            };
            return Promise.resolve(data);
        }
        return fs.loadFile(path.join(dir, 'theme.json')).then((result) => {
            try {
                const data = JSON.parse(result);
                return Promise.resolve(data);
            }
            catch (e) { }
            return Promise.reject({});
        });
    }
    downloadThemeInfo(url) {
        return Get(url).then((result) => {
            try {
                const data = JSON.parse(result);
                if (typeof data !== 'object' ||
                    typeof data.version !== 'number' ||
                    typeof data.name !== 'string') {
                    return Promise.reject({});
                }
                if (typeof data.author !== 'string') {
                    data.author = 'Unknown';
                }
                if (typeof data.info !== 'string') {
                    data.info = '';
                }
                if (typeof data.twitter !== 'string') {
                    data.twitter = 'style.css';
                }
                if (typeof data.cocopo !== 'string') {
                    data.cocopo = 'theme.css';
                }
                data.url = url;
                return Promise.resolve(data);
            }
            catch (e) { }
            return Promise.reject({});
        });
    }
    downloadTheme(data) {
        const baseurl = data.url.replace(/\/[^\/]*$/, '') + '/';
        const dir = path.join(this.dir, data.name);
        return fs.makeDirectory(dir).then(() => {
            const p = [
                Get(baseurl + data.twitter).then((data) => {
                    return fs.saveFile(path.join(dir, 'style.css'), data);
                }),
                Get(baseurl + data.cocopo).then((data) => {
                    return fs.saveFile(path.join(dir, 'theme.css'), data);
                }),
            ];
            return Promise.all(p).then(() => {
                const json = {
                    version: data.version,
                    name: data.name,
                    author: data.author,
                    url: data.url,
                    info: data.info,
                };
                return fs.saveFile(path.join(dir, 'theme.json'), JSON.stringify(json));
            }).catch((error) => {
                return Promise.reject(error);
            });
        });
    }
}
function _Get(resolve, reject) {
    return (result) => {
        let body = '';
        result.setEncoding('utf8');
        result.on('data', (chunk) => { body += chunk; });
        result.on('end', () => { resolve(body); });
    };
}
function Get(url) {
    return new Promise((resolve, reject) => {
        let req;
        if (url.match(/^https\:\/\//)) {
            req = https.get(url, _Get(resolve, reject));
        }
        else if (url.match(/^http\:\/\//)) {
            req = http.get(url, _Get(resolve, reject));
        }
        else {
            return reject({});
        }
        req.on('error', (error) => { reject(error); });
    });
}
module.exports = ThemeManager;
