"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirs = exports.getFolders = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function isDirectory(path) {
    return fs_1.statSync(path).isDirectory();
}
function getFolders(dir) {
    return fs_1.readdirSync(dir).filter(file => isDirectory(path_1.join(dir, file)));
}
exports.getFolders = getFolders;
function getDirs(base) {
    return getFolders(base).map(path => `${base}/${path}`);
}
exports.getDirs = getDirs;
