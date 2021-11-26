import { Autowire, Component, RegisterTap } from "@symph/core";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { join, sep } from "path";
import { readFileSync } from "fs";
import { FSWatcher, watch } from "chokidar";
import lodash from "lodash";
import { FileGenerator, IGenerateFiles } from "./file-generator";
import { handlebars } from "../lib/handlebars";

interface RegisteredModule {
  mount: string;
  filePath: string;
}

class AggregateChange {
  constructor(public add: RegisteredModule[] = [], public remove: RegisteredModule[] = [], public change: RegisteredModule[] = []) {}
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

  public modules: RegisteredModule[] = [];

  private aggregateTimeout = 100;
  public aggregateChange: AggregateChange = new AggregateChange();

  protected moduleTemplate = handlebars.compile(readFileSync(join(__dirname, "../joy-server/server/joy-app-providers-explorer.handlebars"), "utf-8"));
  protected lastGenerateContent: string | undefined;

  public isWatch = false;

  constructor(@Autowire() private joyAppConfig: JoyAppConfig, private fileGenerator: FileGenerator) {
    this.srcDir = this.joyAppConfig.resolveAppDir("src/server");
    this.isWatch = this.joyAppConfig.dev;
  }

  @RegisterTap()
  public async onWillJoyBuild() {
    await this.getApiSrcFiles(this.joyAppConfig.dev);
  }

  public getApiSrcFiles(isWatch = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.watcher = watch([`${this.srcDir}${sep}**${sep}*.{js,jsx,ts,tsx}`], {
        ignored: "**/*.{spec,test}.{js,jsx,ts,tsx}",
        followSymlinks: false,
        awaitWriteFinish: true,
        ignoreInitial: false,
        persistent: isWatch,
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
        await this.applyAggregatedChanges();
        console.log(`Scan server directory (${this.srcDir}) success. ${this.isWatch ? "Ready for changes..." : ""}`);
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
      const index = this.modules.findIndex((it) => it.mount === f.mount && it.filePath === f.filePath);
      if (index > 0) {
        this.modules.splice(index, 1);
      }
    }
    for (const f of aggregateChange.add) {
      this.modules.push(f);
    }

    await this.fileGenerator.generate();
  }

  /**
   * 注册外部模块
   * @param mount
   * @param path
   */
  public registerModule(mount: string, path: string) {
    this.applyChange(mount, path, "add");
  }

  triggerAggregatedChange = lodash.debounce(
    async () => {
      await this.applyAggregatedChanges();
    },
    this.aggregateTimeout,
    { trailing: true, leading: false }
  );

  private applyChange(mount = "", filePath: string, changeType: keyof AggregateChange) {
    this.aggregateChange[changeType].push({ mount, filePath: filePath });
    if (this.isWatch) {
      this.triggerAggregatedChange();
    }
  }

  @RegisterTap()
  public async onGenerateFiles(genFiles: IGenerateFiles) {
    const modules = this.modules.map((f) => ({ path: f.filePath, mount: f.mount } as ServerModule));

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
