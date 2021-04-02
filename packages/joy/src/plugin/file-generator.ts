import { FSWatcher, watch } from "chokidar";
import lodash from "lodash";
import winPath from "../util/winPath/winPath";
import {
  Hook,
  HookPipe,
  HookType,
  Injectable,
  ProviderLifecycle,
  Tap,
} from "@symph/core";
import { dirname } from "path";
import { EOL } from "os";
import { promises } from "fs";
import { JoyAppConfig } from "../next-server/server/joy-config/joy-app-config";
import mkdirp from "mkdirp";
import { recursiveDelete } from "../lib/recursive-delete";
import { fileExists } from "../lib/file-exists";

const GEN_CLIENT_CONTENT = `
const modules = (typeof window !== 'undefined' && window.__JOY_AUTOGEN) || [];
const commonCtx = require.context('./common', true, /\.(jsx?|tsx?|json)$/i);
for (const key of commonCtx.keys()) {
  modules.push(commonCtx(key));
}

const ctx = require.context('./client', true, /\.(jsx?|tsx?|json)$/i);
for (const key of ctx.keys()) {
console.log('>>>> gen-client-modules, key:', key);
  modules.push(ctx(key));
}
console.log('>>>> gen-client-modules, modules:', modules);
if (typeof window !== 'undefined') {
  window.__JOY_AUTOGEN = modules;
};

export default modules;
`;

const GEN_SERVER_CONTENT = `
const modules = [];
const commonCtx = require.context('./common', true, /\.(jsx?|tsx?|json)$/i);
for (const key of commonCtx.keys()) {
  modules.push(commonCtx(key));
}

const ctx = require.context('./server', true, /\.(jsx?|tsx?|json)$/i);
for (const key of ctx.keys()) {
  modules.push(ctx(key));
}
console.log('>>>> gen-server-modules, modules:', modules);
export default modules;
`;

type TWriteFileOptions = {
  skipTSCheck?: boolean;
};

@Injectable()
export class FileGenerator implements ProviderLifecycle {
  constructor(private joyAppConfig: JoyAppConfig) {}

  async afterPropertiesSet() {
    await this.cleanTempFiles();
    await this.mkTempDirs();
    await this.generateEntryModuleFiles();
  }

  @Hook({ type: HookType.Traverse, async: true })
  public onGenerateFiles: HookPipe;

  @Hook({ type: HookType.Waterfall, async: true })
  public addTmpGenerateWatcherPaths: HookPipe;

  public watchers: FSWatcher[] = [];

  private async generateFiles() {
    console.debug("generate files");
    await this.onGenerateFiles.call();
  }

  @Tap({ hookId: "onGenerateFiles" })
  public async generateEntryModuleFiles() {
    console.log(">>>> FileGenerator. onGenerateFiles");
    await Promise.all([
      this.writeServerFile("../gen-server-modules.js", GEN_SERVER_CONTENT, {
        skipTSCheck: true,
      }),
      this.writeClientFile("../gen-client-modules.js", GEN_CLIENT_CONTENT, {
        skipTSCheck: true,
      }),
    ]);
  }

  public async cleanTempFiles(): Promise<void> {
    const absPath = this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir
    );
    if (!(await fileExists(absPath, "directory"))) {
      return;
    }
    await recursiveDelete(absPath);
  }

  public async mkTempDirs() {
    const common = this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir,
      "./common"
    );
    const serverPath = this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir,
      "./server"
    );
    const clientPath = this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir,
      "./client"
    );
    if (!(await fileExists(common, "directory"))) {
      await mkdirp(common);
    }
    if (!(await fileExists(serverPath, "directory"))) {
      await mkdirp(serverPath);
    }
    if (!(await fileExists(clientPath, "directory"))) {
      await mkdirp(clientPath);
    }
  }

  public async generate(watch: boolean) {
    await this.generateFiles();
    if (watch) {
      const watchPaths = await this.addTmpGenerateWatcherPaths.call([]);
      lodash
        .uniq<string>(watchPaths.map((p: string) => winPath(p)))
        .forEach((p) => {
          this.watcherPath(p);
        });
    }
  }

  public watcherPath(path: string) {
    const watcher = watch(path, {
      // ignore .dotfiles and _mock.js
      ignored: /(^|[\/\\])(_mock.js$|\..)/,
      ignoreInitial: true,
    });
    watcher.on(
      "all",
      lodash.throttle(async (event, path) => {
        // debug(`${event} ${path}`);
        await this.generateFiles();
      }, 100)
    );
    this.watchers.push(watcher);
  }

  public unwatch() {
    this.watchers.forEach((watcher) => {
      watcher.close();
    });
  }

  public async mkdirp(path: string) {
    if (!(await fileExists(path))) {
      await mkdirp(dirname(path));
    }
  }

  public getServerFilePath(outputPath: string): string {
    return this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir,
      "./server",
      outputPath
    );
  }

  public getClientFilePath(outputPath: string): string {
    return this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir,
      "./client",
      outputPath
    );
  }

  public getCommonFilePath(outputPath: string): string {
    return this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      this.joyAppConfig.autoGenOutputDir,
      "./common",
      outputPath
    );
  }

  private async writeTmpFile(
    absPath: string,
    content: string,
    { skipTSCheck }: TWriteFileOptions
  ): Promise<void> {
    // const absPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.outDir, this.joyAppConfig.autoGenOutputDir, path)
    if (await fileExists(dirname(absPath))) {
      await mkdirp(dirname(absPath));
    }
    if (isTSFile(absPath) && skipTSCheck) {
      // write @ts-nocheck into first line
      content = `// @ts-nocheck${EOL}${content}`;
    }
    if (await fileExists(absPath)) {
      // todo complete cache,  the cacheContent content is from memory
      const cacheContent = await promises.readFile(absPath, "utf-8");
      if (cacheContent === content) {
        return;
      }
    }
    await promises.writeFile(absPath, content, "utf-8");
  }

  public async writeCommonFile(
    commonOutputPath: string,
    content: string,
    options: TWriteFileOptions = { skipTSCheck: false }
  ): Promise<void> {
    const commonPath = this.getCommonFilePath(commonOutputPath);
    return this.writeTmpFile(commonPath, content, options);
  }

  public async writeServerFile(
    serverOutputPath: string,
    content: string,
    options: TWriteFileOptions = { skipTSCheck: false }
  ): Promise<void> {
    const serverPath = this.getServerFilePath(serverOutputPath);
    return this.writeTmpFile(serverPath, content, options);
  }

  public async writeClientFile(
    clientOutputPath: string,
    content: string,
    options: TWriteFileOptions = { skipTSCheck: false }
  ): Promise<void> {
    const clientPath = this.getClientFilePath(clientOutputPath);
    return this.writeTmpFile(clientPath, content, options);
  }
}

/**
 * judge whether ts or tsx file exclude d.ts
 * @param path
 */
export const isTSFile = (path: string): boolean => {
  return !/\.d\.ts$/.test(path) && /\.(ts|tsx)$/.test(path);
};
