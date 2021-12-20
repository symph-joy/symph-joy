import path from "path";
import {
  InjectHook,
  Component,
  getComponentMeta,
  getConfigurationMeta,
  HookType,
  IHook,
  TComponent,
  ComponentScanner,
  ComponentName,
} from "@symph/core";
import { isFunction, isNil } from "@symph/core/dist/utils/shared.utils";
import { ModuleContextTypeEnum } from "../../lib/constants";
import { existsSync } from "fs";
import * as Log from "../output/log";
import { FSWatcher, watch } from "chokidar";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { SrcBuilder } from "../src-builder";
import lodash from "lodash";
import { FileGenerator } from "../file-generator";

type TScanOutModuleProviders = Map<string, { type: "ClassProvider" | "Configuration"; providers: TComponent[] }>;

export interface IScanOutModule {
  path: string; // build dist file path
  resource: string | undefined; // source file path
  contextType: ModuleContextTypeEnum;
  mount: string | undefined;
  module: Record<string, unknown>;
  providerDefines?: TScanOutModuleProviders;
  isAdd?: boolean;
  isModify?: boolean;
  isRemove?: boolean;
  hash?: string;
}

interface ScanOptions {
  contextType?: ModuleContextTypeEnum; // default is server
  mount?: string;
  onScanOutModule?(scanOutModule: IScanOutModule): void | boolean;
}

interface IScanModule {
  filePath: string;
  scanOptions: ScanOptions;
}

class AggregateChange {
  constructor(public add: IScanModule[] = [], public remove: IScanModule[] = [], public change: IScanModule[] = []) {}
}

/**
 * todo 通过emit-manifest.json的hash值，判断是否需要扫描或者更新模块。
 * todo 如果判断是被删除了的模块。
 */
@Component()
export class FileScanner {
  private watchers: Map<string, FSWatcher> = new Map();

  public isWatch = false;
  private aggregateTimeout = 50;
  public aggregateChange: AggregateChange = new AggregateChange();

  constructor(
    private readonly joyAppConfig: JoyAppConfig,
    private componentScanner: ComponentScanner,
    private srcBuilder: SrcBuilder,
    private fileGenerator: FileGenerator
  ) {
    this.isWatch = this.joyAppConfig.dev;
  }

  @InjectHook({ type: HookType.Waterfall, parallel: false, async: true })
  private afterScanOutModuleHook: IHook;

  private cachedModules: Map<string, IScanOutModule> = new Map();

  public getCacheModuleByProviderName(providerName: ComponentName | ComponentName[]): IScanOutModule | undefined {
    const moduleKeys = new Array(...this.cachedModules.keys());
    for (let i = 0; i < moduleKeys.length; i++) {
      const key = moduleKeys[i];
      const cacheModule = this.cachedModules.get(key);
      if (!cacheModule || !cacheModule.providerDefines) {
        continue;
      }
      for (const providerDefine of cacheModule.providerDefines.values()) {
        const findOutProvider = providerDefine.providers?.find((p) => p.name === providerName);
        if (findOutProvider) {
          return cacheModule;
        }
      }
    }
    return undefined;
  }

  public getSourceFileByProviderId(providerId: string): string | undefined {
    const cacheModule = this.getCacheModuleByProviderName(providerId);
    if (cacheModule) {
      return cacheModule.resource;
    }
    return undefined;
  }

  public async scanDist(distDir: string): Promise<void> {
    Log.wait("scan react components...");
    // todo 支持简化的前端或者后端目录结构， 例如：纯前端应用，src目录下直接展平client目录。
    let distClientDir = path.join(distDir, "./client");
    // const distServerDir = path.join(distDir, "./server");
    if (!existsSync(distClientDir)) {
      distClientDir = path.join(distDir, "./pages");
    }

    if (existsSync(distClientDir)) {
      await this.scan(distClientDir, { contextType: ModuleContextTypeEnum.React });
    }
    // if (existsSync(distServerDir)) {
    //   await this.scan(distServerDir, { contextType: ModuleContextTypeEnum.Server });
    // }
  }

  public async scan(dir: string, options: ScanOptions = {}): Promise<void> {
    // this.emitSrcService.updateEmitManifest();
    let watcher = this.watchers.get(dir);
    if (watcher) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      watcher = watch(dir);
      this.watchers.set(dir, watcher);
      watcher.on("add", (filePath) => {
        this.applyChange("", filePath, "add", options);
      });
      watcher.on("change", (filePath) => {
        this.applyChange("", filePath, "change", options);
      });
      watcher.on("unlink", (filePath) => {
        this.applyChange("", filePath, "remove", options);
      });
      watcher.on("ready", async () => {
        await this.applyAggregatedChanges();
        Log.event(`scan react components success. ${this.isWatch ? "Ready for changes..." : ""}`);
        resolve();
      });
      watcher.on("error", (error) => {
        reject(error);
      });
    });

    // const existModuleKeys = Array.from(this.cachedModules.keys());
    // const scanOutModuleKeys: string[] = [];
    //
    // await new Promise<void>((resolve, reject) => {
    //   glob("**/*.{js,jsx,ts,tsx}", { cwd: dir }, async (err, files) => {
    //     if (err) {
    //       reject(err);
    //     }
    //     if (files.length === 0) {
    //       resolve();
    //     }
    //
    //     for (let i = 0; i < files.length; i++) {
    //       const filePath = files[i];
    //       const fullPath = path.resolve(dir, filePath);
    //       scanOutModuleKeys.push(fullPath);
    //       await this.scanFile(fullPath, options);
    //     }
    //     resolve();
    //   });
    // });
    //
  }

  private applyChange(mount = "", filePath: string, changeType: keyof AggregateChange, scanOptions: ScanOptions) {
    this.aggregateChange[changeType].push({ filePath, scanOptions });
    if (this.isWatch) {
      this.triggerAggregatedChange();
    }
  }

  triggerAggregatedChange = lodash.debounce(
    async () => {
      await this.applyAggregatedChanges();
    },
    this.aggregateTimeout,
    { trailing: true, leading: false }
  );

  private async applyAggregatedChanges() {
    if (!this.aggregateChange.add.length && !this.aggregateChange.change.length && !this.aggregateChange.remove.length) {
      return;
    }
    const aggregateChange = this.aggregateChange;
    this.aggregateChange = new AggregateChange();

    for (const f of aggregateChange.remove) {
      await this.triggerModuleRemoved(f.filePath);
    }
    const buildList = [...aggregateChange.add, ...aggregateChange.change];
    for (const f of buildList) {
      await this.scanFile(f.filePath, f.scanOptions);
    }
    await this.fileGenerator.generate();
  }

  public async triggerModuleRemoved(fullFilePath: string) {
    const cached = this.cachedModules.get(fullFilePath);
    if (cached === undefined || cached.isRemove) {
      return cached;
    }
    cached.isAdd = cached.isModify = false;
    cached.isRemove = true;
    await this.afterScanOutModuleHook.call(cached);
    this.cachedModules.delete(fullFilePath);
  }

  public async scanFile(fullFilePath: string, options: ScanOptions = {}): Promise<IScanOutModule | undefined> {
    const { mount, contextType = ModuleContextTypeEnum.Server } = options;
    const emit = this.srcBuilder.getBuildModule(fullFilePath);
    const emitHash = emit?.hash;
    const cached = this.cachedModules.get(fullFilePath);
    if (emitHash !== undefined && cached !== undefined && emitHash === cached.hash) {
      // this file has not been changed, do nothing
      return cached;
    }

    let requiredModule: any;
    try {
      // fixme 如果是修改文件后重新扫描，则会在provider-scanner中遗留旧的模块引用，导致内存溢出。
      delete require.cache[fullFilePath];
      requiredModule = require(fullFilePath);
    } catch (e) {
      console.debug("Load file error:", e);
    }
    if (!requiredModule) {
      return undefined;
    }

    const isAdd = !cached;
    const isModify = !!cached;
    const isRemove = false; // todo 实现remove逻辑

    let scanOutModule: IScanOutModule = {
      path: fullFilePath,
      resource: emit?.resource,
      module: requiredModule,
      contextType,
      mount,
      isAdd,
      isModify,
      isRemove,
      hash: emitHash,
    };
    // const providers = await this.componentScanner.scan(moduleLoaded.module);
    scanOutModule.providerDefines = this.scanModule(scanOutModule.module);

    // todo 优化: 和cache比较，component没有变化则不用继续处理。

    if (options?.onScanOutModule && options.onScanOutModule(scanOutModule)) {
      return undefined;
    }

    this.cachedModules.set(fullFilePath, scanOutModule);

    scanOutModule = await this.afterScanOutModuleHook.call(scanOutModule);

    return scanOutModule;
  }

  public scanModule(mod: Record<string, unknown>): undefined | TScanOutModuleProviders {
    if (mod === undefined || mod === null) {
      return undefined;
    }
    let providerDefines = new Map() as TScanOutModuleProviders;
    Object.keys(mod).forEach((prop) => {
      const propValue = mod[prop];
      if (isNil(propValue)) return;

      if (isFunction(propValue)) {
        const providers = this.componentScanner.scan(propValue as any);
        // 1.configuration class
        if (getConfigurationMeta(propValue)) {
          providerDefines.set(prop, { type: "Configuration", providers });
        } else if (getComponentMeta(propValue)) {
          // 2. provider class
          providerDefines.set(prop, { type: "ClassProvider", providers });
        }
      }
    });
    return providerDefines;
  }
}
