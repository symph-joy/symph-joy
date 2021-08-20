"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packagePaths = exports.samplePath = exports.source = void 0;
const task_helpers_1 = require("./util/task-helpers");
// All paths are related to the base dir
exports.source = 'packages';
exports.samplePath = 'sample';
exports.packagePaths = task_helpers_1.getDirs(exports.source);
