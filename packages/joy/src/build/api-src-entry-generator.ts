import { Autowire, Component, IComponentLifecycle, Optional, RegisterTap } from "@symph/core";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import glob from "glob";
import path, { join, sep } from "path";
import fs, { readFileSync } from "fs";
import { FSWatcher, watch } from "chokidar";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import lodash, { pull } from "lodash";
import { IGenerateFiles } from "./file-generator";
import { handlebars } from "../lib/handlebars";
import HotReloader from "../server/hot-reloader";

class AggregateChange {
  constructor(public add: string[] = [], public remove: string[] = [], public change: string[] = []) {}
}

interface ServerModule {
  path: string;
  mount?: string;
}

@Component()
export class ApiSrcEntryGenerator {
  public srcDir: string;

  public sourceFileExts = ["js", "jsx", "ts", "tsx"];

  public watcher: FSWatcher | undefined;

  public srcFiles: string[] = [];

  private aggregateTimeout = 200;
  public aggregateChange: AggregateChange = new AggregateChange();

  protected moduleTemplate = handlebars.compile(readFileSync(join(__dirname, "../joy-server/server/joy-app-providers-explorer.handlebars"), "utf-8"));
  protected lastGenerateContent: string | undefined;

  public watch = false;

  constructor(@Autowire() private joyAppConfig: JoyAppConfig, @Optional() private hotReloader: HotReloader) {
    this.srcDir = this.joyAppConfig.resolveAppDir("src/server");
    this.watch = this.joyAppConfig.dev;
  }

  @RegisterTap()
  public async onWillJoyBuild() {
    await this.getApiSrcFiles(this.joyAppConfig.dev);
  }

  // async getApiSrcFiles(isWatch = false): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     // this.watcher = watch([`${this.srcDir}/`], {followSymlinks: false, awaitWriteFinish: true})
  //     // this.watcher
  //     //   .on('add', (path) => {
  //     //     console.log('>>>> add', path)
  //     //   })
  //     //   .on('change', (path) => {
  //     //     console.log('>>>> change', path)
  //     //   })
  //     //   .on('ready', () => {
  //     //     console.log('Initial scan complete. Ready for changes')
  //     //   })
  //     //
  //     // if (isWatch){
  //     //   this.watcher.close();
  //     //   this.watcher = undefined;
  //     // }
  //
  //     glob(`**/*.{${this.sourceFileExts.join(',')}}`, {cwd: this.srcDir}, async (err, files) => {
  //       if (err) {
  //         reject(err)
  //       }
  //       const sourceFiles: string[] = [];
  //       for (let i = 0; i < files.length; i++) {
  //         const filePath = files[i];
  //         let fullPath = path.resolve(this.srcDir, filePath);
  //         fullPath = path.normalize(fullPath);
  //         fullPath = fullPath.replace(/\\/g, "/");
  //         sourceFiles.push(fullPath);
  //       }
  //       if (isWatch) {
  //         this.startWatch()
  //       }
  //       this.srcFiles = sourceFiles;
  //
  //       resolve(sourceFiles)
  //     });
  //   })
  // }

  public getApiSrcFiles(isWatch = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.watcher = watch([`${this.srcDir}${sep}**${sep}*.ts`], {
        followSymlinks: false,
        awaitWriteFinish: true,
        ignoreInitial: false,
        persistent: isWatch,
      });
      this.watcher.on("add", (filePath) => {
        console.log(">>>> add", filePath, process.uptime());
        this.applyChange(filePath, "add");
      });
      this.watcher.on("change", (filePath) => {
        console.log(">>>> change", filePath, process.uptime());
        this.applyChange(filePath, "change");
      });
      this.watcher.on("unlink", (filePath) => {
        console.log(">>>> remove", filePath, process.uptime());
        this.applyChange(filePath, "remove");
      });
      this.watcher.on("error", (error) => {
        console.log(`Watcher error: ${error}`);
        reject(error);
      });
      this.watcher.on("ready", () => {
        this.applyAggregatedChanges();
        console.log("Initial scan src directory complete. Ready for changes", process.uptime());
        resolve();
      });
    });
  }

  private applyAggregatedChanges() {
    const aggregateChange = this.aggregateChange;
    this.aggregateChange = new AggregateChange();
    for (const f of aggregateChange.add) {
      this.srcFiles.push(f);
    }

    for (const f of aggregateChange.remove) {
      const index = this.srcFiles.indexOf(f);
      if (index > 0) {
        this.srcFiles.splice(index, 1);
      }
    }
  }

  triggerAggregatedChange = lodash.debounce(
    () => {
      console.log(">>>>> apply changes, this.aggregateChange", this.aggregateChange, process.uptime());
      this.applyAggregatedChanges();
      this.hotReloader.invalidateApi();
    },
    this.aggregateTimeout,
    { trailing: true, leading: false }
  );

  applyChange(filePath: string, changeType: keyof AggregateChange) {
    this.aggregateChange[changeType].push(filePath);
    if (this.watch) {
      this.triggerAggregatedChange();
    }
  }

  @RegisterTap()
  public async onGenerateFiles(genFiles: IGenerateFiles) {
    console.log(">>>>> api gen files", process.uptime());
    const modules = this.srcFiles.map((f) => ({ path: f } as ServerModule));

    const moduleFileContent = this.moduleTemplate({ modules });
    if (this.lastGenerateContent?.length === moduleFileContent.length && this.lastGenerateContent === moduleFileContent) {
      // Module has not changed， so should not update.
      return genFiles;
    }
    this.lastGenerateContent = moduleFileContent;
    genFiles["./joy/server-providers.config.js"] = moduleFileContent;
    return genFiles;
  }
}
