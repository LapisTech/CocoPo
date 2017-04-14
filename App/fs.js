"use strict";
const fs = require("fs");
const path = require("path");
class FileSystem {
    static loadFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf8', (error, data) => {
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }
    static saveFile(file, data, sync = false) {
        if (sync) {
            fs.writeFileSync(file, data);
            return Promise.resolve({});
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(file, data, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve({});
            });
        });
    }
    static existsDirectory(dir) {
        try {
            const stat = fs.statSync(dir);
            if (stat && stat.isDirectory()) {
                return true;
            }
        }
        catch (e) { }
        return false;
    }
    static makeDirectory(dir) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dir, (error) => {
                if (error && error.code !== 'EEXIST') {
                    return reject({ error: error });
                }
                resolve({ exsists: !!error });
            });
        });
    }
    static readDirectory(dir) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (error, dirs) => {
                if (error) {
                    return resolve([]);
                }
                resolve(dirs.filter((item) => {
                    if (item.match(/^\./)) {
                        return false;
                    }
                    return FileSystem.existsDirectory(path.join(dir, item));
                }));
            });
        });
    }
}
module.exports = FileSystem;
