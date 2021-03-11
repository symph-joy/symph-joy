import { join } from "path";
import { promisify } from "util";
import fs from "fs";
import { IS_BUNDLED_PAGE_REGEX } from "../../../lib/constants";
import * as webpack from "webpack";

const unlink = promisify(fs.unlink);

export default class UnlinkFilePlugin {
  prevAssets: any;
  constructor() {
    this.prevAssets = {};
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.afterEmit.tapAsync(
      "JoyUnlinkRemovedPages",
      (compilation, callback) => {
        const removed = Object.keys(this.prevAssets).filter(
          (a) => IS_BUNDLED_PAGE_REGEX.test(a) && !compilation.assets[a]
        );

        this.prevAssets = compilation.assets;

        Promise.all(
          removed.map(async (f) => {
            const path = join(compiler.outputPath, f);
            try {
              await unlink(path);
            } catch (err) {
              if (err.code === "ENOENT") return;
              throw err;
            }
          })
        ).then(() => callback(), callback);
      }
    );
  }
}
