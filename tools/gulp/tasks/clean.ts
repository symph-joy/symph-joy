import {task, series} from 'gulp';
import {source} from '../config';
import {tsPackageConfigs} from "./modules";
import * as path from 'path'
import * as log from 'fancy-log';
import * as fs from "fs";

const packageNames = Object.keys(tsPackageConfigs)

/**
 * Cleans out dirs
 */
function cleanDirs(packageName, done: () => void) {
  const dir = path.resolve(`${source}/${packageName}/dist`)
  if (fs.existsSync(dir)) {
    log.info(`clean dir:${dir}`);
    fs.rmdirSync(dir, {recursive: true})
  }
  done();
}

function cleanNodeModule(done: () => void) {
  const dir = path.resolve(`node_modules/@symph`)
  if (fs.existsSync(dir)) {
    log.info(`clean dir:${dir}`);
    fs.rmdirSync(dir, {recursive: true})
  }
  done();
}


packageNames.forEach(packageName => {
  task(`clean:${packageName}`, (done) => cleanDirs(packageName, done), )
});
task('clean:node_module', cleanNodeModule)

task('clean:bundle', series(packageNames.map(packageName => `clean:${packageName}`), 'clean:node_module'));
