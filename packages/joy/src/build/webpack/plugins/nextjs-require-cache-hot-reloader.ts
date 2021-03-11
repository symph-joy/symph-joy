import { Compiler, version, WebpackPluginInstance } from "webpack";
import { realpathSync, utimesSync } from "fs";
import path from "path";

const isWebpack5 = parseInt(version!) === 5;

function deleteCache(filePath: string, updateModifyTime = false) {
  try {
    if (updateModifyTime && typeof jest !== "undefined") {
      // in jest, the `delete require.cache` will not work. so try to update the modify time
      utimesSync(realpathSync(filePath), new Date(), new Date());
    }
    delete require.cache[realpathSync(filePath)];
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  } finally {
    delete require.cache[filePath];
  }
}

const PLUGIN_NAME = "NextJsRequireCacheHotReloader";

// This plugin flushes require.cache after emitting the files. Providing 'hot reloading' of server files.
export class NextJsRequireCacheHotReloader implements WebpackPluginInstance {
  prevAssets: any = null;
  previousOutputPathsWebpack5: Set<string> = new Set();
  currentOutputPathsWebpack5: Set<string> = new Set();

  apply(compiler: Compiler) {
    if (isWebpack5) {
      // @ts-ignored Webpack has this hooks
      compiler.hooks.assetEmitted.tap(
        PLUGIN_NAME,
        (_file: any, { targetPath }: any) => {
          this.currentOutputPathsWebpack5.add(targetPath);
          deleteCache(targetPath);
        }
      );

      compiler.hooks.afterEmit.tap(PLUGIN_NAME, (compilation) => {
        const runtimeChunkPath = path.join(
          compilation.outputOptions.path!,
          "webpack-runtime.js"
        );

        deleteCache(runtimeChunkPath, true);

        for (const outputPath of this.previousOutputPathsWebpack5) {
          if (!this.currentOutputPathsWebpack5.has(outputPath)) {
            deleteCache(outputPath);
          }
        }

        this.previousOutputPathsWebpack5 = new Set(
          this.currentOutputPathsWebpack5
        );
        this.currentOutputPathsWebpack5.clear();
      });
      return;
    }

    compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      const { assets } = compilation;

      if (this.prevAssets) {
        for (const f of Object.keys(assets)) {
          // todo webpack里已经没这个属性了，需要重新寻找方法来清除require中的缓存
          // @ts-ignore
          deleteCache(assets[f].existsAt);
        }
        for (const f of Object.keys(this.prevAssets)) {
          if (!assets[f]) {
            // @ts-ignore
            deleteCache(this.prevAssets[f].existsAt);
          }
        }
      }
      this.prevAssets = assets;

      callback();
    });
  }
}
