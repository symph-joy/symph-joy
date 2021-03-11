import { series, task } from "gulp";
import * as path from "path";
import * as log from "fancy-log";
import * as fs from "fs";

/**
 * Cleans out dirs
 */
function cleanDirs(done: () => void) {
  const dir = path.resolve(`dist`);
  if (fs.existsSync(dir)) {
    log.info(`clean dir:${dir}`);
    fs.rmdirSync(dir, { recursive: true });
  }
  done();
}

task(`clean:dist`, (done) => cleanDirs(done));

task("clean:bundle", series("clean:dist"));
