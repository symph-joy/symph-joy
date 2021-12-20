import { Inject, Component } from "@symph/core";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import path, { join, sep } from "path";
import { ensureFile, existsSync, rmSync, writeFile } from "fs-extra";
import { FSWatcher, watch } from "chokidar";
import lodash from "lodash";
import * as babel from "@babel/core";
import joySrcBabelPreset from "./babel-src/preset-src";
import { OutputState, store as consoleStore } from "./output/store";
import * as Log from "./output/log";

interface FileModule {
  filePath: string;
}

export interface ISrcBuildModule {
  resource: string;
  dest: string;
  hash: string;
}

class AggregateChange {
  constructor(public add: FileModule[] = [], public remove: FileModule[] = [], public change: FileModule[] = []) {}
}

@Component()
export class SrcBuilder {
  public srcDir: string;
  public rootDir: string;
  public distPath: string;
  public sourceFileExts = ["js", "jsx", "ts", "tsx"];
  public watcher: FSWatcher | undefined;
  private aggregateTimeout = 50;
  public aggregateChange: AggregateChange = new AggregateChange();
  private buildManifest: Record<string, ISrcBuildModule>;
  public isWatch = false;

  constructor(@Inject() private joyAppConfig: JoyAppConfig) {
    const clientDir = this.joyAppConfig.resolveAppDir("src/client");
    this.rootDir = this.joyAppConfig.resolveAppDir("src");
    if (existsSync(clientDir)) {
      this.srcDir = clientDir;
    } else if (existsSync(this.rootDir)) {
      this.srcDir = this.rootDir;
    } else {
      console.debug("React src dir(src/client or src/pages) is not exists.");
    }
    this.isWatch = this.joyAppConfig.dev;

    this.distPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, "dist");

    this.updateBuildManifest();
  }

  // @RegisterTap()
  // public async onWillJoyBuild() {
  // }

  // todo 收集编译异常信息
  public async buildSrcFiles(): Promise<void> {
    if (!this.srcDir) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      this.watcher = watch([`${this.srcDir}${sep}**${sep}*.{js,jsx,ts,tsx}`], {
        ignored: "**/*.{spec,test}.{js,jsx,ts,tsx}",
        followSymlinks: false,
        awaitWriteFinish: true,
        ignoreInitial: false,
        persistent: this.isWatch,
      });
      this.watcher.on("add", (filePath) => {
        this.applyChange(undefined, filePath, "add");
      });
      this.watcher.on("change", (filePath) => {
        this.applyChange(undefined, filePath, "change");
      });
      this.watcher.on("unlink", (filePath) => {
        this.applyChange(undefined, filePath, "remove");
      });
      this.watcher.on("error", (error) => {
        reject(error);
      });
      this.watcher.on("ready", async () => {
        Log.event(`compile react (${this.srcDir}) success. ${this.isWatch ? "Ready for changes..." : ""}`);
        await this.applyAggregatedChanges();
        resolve();
      });
    });
  }

  private async applyAggregatedChanges() {
    if (!this.aggregateChange.add.length && !this.aggregateChange.change.length && !this.aggregateChange.remove.length) {
      return;
    }
    const aggregateChange = this.aggregateChange;
    this.aggregateChange = new AggregateChange();

    for (const f of aggregateChange.remove) {
      // 实现 delete
      const destPath = this.getDescPath(f.filePath);
      if (existsSync(destPath)) {
        rmSync(destPath);
      }
      delete this.buildManifest[destPath];
    }

    const buildList = [...aggregateChange.add, ...aggregateChange.change];
    for (const f of buildList) {
      const destPath = this.getDescPath(f.filePath);
      await this.transFile(f.filePath, destPath);
    }
    await this.persistenceBuildManifest();
  }

  private presetItem = babel.createConfigItem(joySrcBabelPreset, { type: "preset" });

  private getDescPath(filePath: string): string {
    let dest = path.join(this.distPath, filePath.replace(this.joyAppConfig.resolveAppDir("./"), ""));
    dest = dest.replace(/\.ts$/, ".js").replace(/\.tsx$/, ".js");
    return dest;
  }

  private async transFile(filePath: string, destPath: string) {
    let dist: babel.BabelFileResult | null = null;
    try {
      dist = await babel.transformFileAsync(filePath, {
        presets: [this.presetItem],
      });
    } catch (e) {
      // 1. 启动期间抛出异常，
      // 2. 而运行期间忽略异常，由webpack打包处理源码中的异常，等用户修复后，刷新界面。
      if (consoleStore.getState().bootstrap) {
        console.error(e);
      } else {
        //noop
      }
    }
    if (!dist) {
      return;
    }
    const { code } = dist;

    await ensureFile(destPath);
    await writeFile(destPath, code);

    this.buildManifest[destPath] = {
      dest: destPath,
      resource: filePath,
    } as ISrcBuildModule;
  }

  triggerAggregatedChange = lodash.debounce(
    async () => {
      await this.applyAggregatedChanges();
    },
    this.aggregateTimeout,
    { trailing: true, leading: false }
  );

  private applyChange(mount = "", filePath: string, changeType: keyof AggregateChange) {
    if (filePath.startsWith(path.join(this.rootDir, "server"))) {
      // 服务端代码，由服务端模块处理，这里暂时只处理React的代码。
      return;
    }
    this.aggregateChange[changeType].push({ filePath: filePath });
    if (this.isWatch) {
      this.triggerAggregatedChange();
    }
  }

  public getEmitManifest(): Record<string, ISrcBuildModule> | undefined {
    if (!this.buildManifest) {
      this.updateBuildManifest();
    }
    return this.buildManifest;
  }

  public getBuildModule(destAbsPath: string): ISrcBuildModule | undefined {
    return this.buildManifest[destAbsPath];
  }

  public getBuildModuleBySrc(srcAbsPath: string): ISrcBuildModule | undefined {
    for (const key of Object.keys(this.buildManifest)) {
      if (this.buildManifest[key].resource === srcAbsPath) {
        return this.buildManifest[key];
      }
    }
    return undefined;
  }

  public updateBuildManifest(): void {
    this.buildManifest = this.readCurrentEmitManifest() || {};
  }
  private readCurrentEmitManifest(): Record<string, ISrcBuildModule> | undefined {
    const manifestPath = join(this.distPath, "emit-manifest.json");
    let manifest: Record<string, ISrcBuildModule> | undefined;
    if (existsSync(manifestPath)) {
      manifest = require(manifestPath);
    }
    return manifest;
  }
  private async persistenceBuildManifest() {
    const manifestPath = join(this.distPath, "emit-manifest.json");
    const data = JSON.stringify(this.buildManifest || {});
    await ensureFile(manifestPath);
    await writeFile(manifestPath, data, { encoding: "utf-8" });
  }
}
