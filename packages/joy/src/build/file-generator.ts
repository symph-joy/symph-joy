import { FSWatcher, watch } from "chokidar";
import { InjectHook, Component, HookType, IHook, Inject, IComponentLifecycle } from "@symph/core";
import { dirname } from "path";
import { EOL } from "os";
import { promises } from "fs";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { recursiveDelete } from "../lib/recursive-delete";
import { fileExists } from "../lib/file-exists";
import { Stream } from "stream";
import { mkdirp } from "fs-extra";

const GEN_CLIENT_CONTENT = `
const modules = (typeof window !== 'undefined' && window.__JOY_AUTOGEN) || [];
const commonCtx = require.context('./common', true, /\.(jsx?|tsx?|json)$/i);
for (const key of commonCtx.keys()) {
  modules.push(commonCtx(key));
}

const ctx = require.context('./client', true, /\.(jsx?|tsx?|json)$/i);
for (const key of ctx.keys()) {
  modules.push(ctx(key));
}
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
export default modules;
`;

type TWriteFileOptions = {
  skipTSCheck?: boolean;
};

interface IGenerateFile {
  content: string | Stream;
  skipTSCheck?: boolean;
}

export interface IGenerateFiles {
  [filePath: string]: IGenerateFile | string | Stream;
}

@Component()
export class FileGenerator implements IComponentLifecycle {
  constructor(@Inject() private joyAppConfig: JoyAppConfig) {}

  async initialize() {
    await this.cleanTempFiles();
    await this.mkTempDirs();
    // await this.generateEntryModuleFiles();
  }

  @InjectHook({ type: HookType.Waterfall, async: true })
  private onGenerateFiles: IHook;

  @InjectHook({ type: HookType.Waterfall, async: true })
  private addTmpGenerateWatcherPaths: IHook;

  public watchers: FSWatcher[] = [];

  private async generateFiles() {
    const genFiles = (await this.onGenerateFiles.call({} as IGenerateFiles)) as IGenerateFiles;
    const writePromises = [];
    for (const filePath of Object.keys(genFiles)) {
      const genFile = genFiles[filePath];
      if ((genFile as IGenerateFile).content) {
        const { content, ...options } = genFile as IGenerateFile;
        writePromises.push(this.writeFile(filePath, content, options));
      } else {
        writePromises.push(this.writeFile(filePath, genFile as string | Stream));
      }
    }
    await Promise.all(writePromises);
  }

  public async cleanTempFiles(): Promise<void> {
    const absPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir);
    if (!(await fileExists(absPath, "directory"))) {
      return;
    }
    await recursiveDelete(absPath);
  }

  public async mkTempDirs() {
    const joy = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir, "./joy");
    const commonPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir, "./react/common");
    const serverPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir, "./react/server");
    const clientPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir, "./react/client");
    if (!(await fileExists(joy, "directory"))) {
      await mkdirp(joy);
    }
    if (!(await fileExists(commonPath, "directory"))) {
      await mkdirp(commonPath);
    }
    if (!(await fileExists(serverPath, "directory"))) {
      await mkdirp(serverPath);
    }
    if (!(await fileExists(clientPath, "directory"))) {
      await mkdirp(clientPath);
    }
  }

  public async generate() {
    await this.generateFiles();
    // if (watch) {
    //   const watchPaths = await this.addTmpGenerateWatcherPaths.call([]);
    //   lodash.uniq<string>(watchPaths.map((p: string) => winPath(p))).forEach((p) => {
    //     this.watcherPath(p);
    //   });
    // }
  }

  // public watcherPath(path: string) {
  //   const watcher = watch(path, {
  //     // ignore .dotfiles and _mock.js
  //     ignored: /(^|[\/\\])(_mock.js$|\..)/,
  //     ignoreInitial: true,
  //   });
  //   watcher.on(
  //     "all",
  //     lodash.throttle(async (event, path) => {
  //       // debug(`${event} ${path}`);
  //       await this.generateFiles();
  //     }, 100)
  //   );
  //   this.watchers.push(watcher);
  // }
  //
  // public unwatch() {
  //   this.watchers.forEach((watcher) => {
  //     watcher.close();
  //   });
  // }

  public async mkdirp(path: string) {
    if (!(await fileExists(path))) {
      await mkdirp(dirname(path));
    }
  }

  public getGenPath(outputPath: string): string {
    return this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir, outputPath);
  }

  public getJoyGenFilePath(outputPath: string): string {
    return this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir, this.joyAppConfig.autoGenOutputDir, "./joy", outputPath);
  }

  // public getServerFilePath(outputPath: string): string {
  //   return this.joyAppConfig.resolveAppDir(
  //     this.joyAppConfig.distDir,
  //     this.joyAppConfig.autoGenOutputDir,
  //     "./server",
  //     outputPath
  //   );
  // }
  //
  // public getClientFilePath(outputPath: string): string {
  //   return this.joyAppConfig.resolveAppDir(
  //     this.joyAppConfig.distDir,
  //     this.joyAppConfig.autoGenOutputDir,
  //     "./client",
  //     outputPath
  //   );
  // }
  //
  // public getCommonFilePath(outputPath: string): string {
  //   return this.joyAppConfig.resolveAppDir(
  //     this.joyAppConfig.distDir,
  //     this.joyAppConfig.autoGenOutputDir,
  //     "./common",
  //     outputPath
  //   );
  // }

  private async writeTmpFile(absPath: string, content: string | Stream, { skipTSCheck }: TWriteFileOptions): Promise<void> {
    // const absPath = this.joyAppConfig.resolveAppDir(this.joyAppConfig.outDir, this.joyAppConfig.autoGenOutputDir, path)
    const absDirname = dirname(absPath);
    if (!(await fileExists(absDirname))) {
      await mkdirp(absDirname);
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

  private writeFileCaches = new Map<string, string | Stream>();

  public async writeFile(outPath: string, content: string | Stream, options: TWriteFileOptions = { skipTSCheck: false }) {
    const lastWriteCache = this.writeFileCaches.get(outPath);
    if (lastWriteCache) {
      if (
        typeof content === "string" &&
        typeof lastWriteCache === "string" &&
        lastWriteCache.length === content.length &&
        lastWriteCache === content
      ) {
        // 先判断类型和长度，提高比较效率。
        return;
      } else if (lastWriteCache === content) {
        return;
      }
    }
    this.writeFileCaches.set(outPath, content);

    const isLocal: boolean = outPath.startsWith(".");
    const commonPath = isLocal ? this.getGenPath(outPath) : outPath;
    return this.writeTmpFile(commonPath, content, options);
  }

  public async writeJoyFile(outPath: string, content: string, options: TWriteFileOptions = { skipTSCheck: false }) {
    const commonPath = this.getJoyGenFilePath(outPath);
    return this.writeTmpFile(commonPath, content, options);
  }

  // public async writeCommonFile(
  //   commonOutputPath: string,
  //   content: string,
  //   options: TWriteFileOptions = { skipTSCheck: false }
  // ): Promise<void> {
  //   const commonPath = this.getCommonFilePath(commonOutputPath);
  //   return this.writeTmpFile(commonPath, content, options);
  // }
  //
  // public async writeServerFile(
  //   serverOutputPath: string,
  //   content: string,
  //   options: TWriteFileOptions = { skipTSCheck: false }
  // ): Promise<void> {
  //   const serverPath = this.getServerFilePath(serverOutputPath);
  //   return this.writeTmpFile(serverPath, content, options);
  // }
  //
  // public async writeClientFile(
  //   clientOutputPath: string,
  //   content: string,
  //   options: TWriteFileOptions = { skipTSCheck: false }
  // ): Promise<void> {
  //   const clientPath = this.getClientFilePath(clientOutputPath);
  //   return this.writeTmpFile(clientPath, content, options);
  // }
}

/**
 * judge whether ts or tsx file exclude d.ts
 * @param path
 */
export const isTSFile = (path: string): boolean => {
  return !/\.d\.ts$/.test(path) && /\.(ts|tsx)$/.test(path);
};
