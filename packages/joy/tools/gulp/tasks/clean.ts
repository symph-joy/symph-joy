import { series, task } from "gulp";
import * as path from "path";
import * as log from "fancy-log";
import * as fs from "fs-extra";

/**
 * Cleans out dirs
 */
function cleanDirs(done: () => void) {
  const dir = path.resolve(`dist`);
  if (fs.existsSync(dir)) {
    log.info(`clean dir:${dir}`);
    fs.rmSync(dir, { recursive: true });
  }

  done();
}

task("clean", (done) => cleanDirs(done));
