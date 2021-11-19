import glob from "glob";
import path from "path";
import { AutowireHook, Component, CoreContext, getConfigurationMeta, getComponentMeta, HookType, IHook, CoreContainer, Provider, ProviderScanner, TProviderName } from "@symph/core";
import { EmitSrcService } from "../webpack/plugins/emit-src-plugin/emit-src-service";
import { isFunction, isNil } from "@symph/core/dist/utils/shared.utils";
import { ModuleContextTypeEnum } from "../../lib/constants";
import { existsSync } from "fs";
import * as Log from "../output/log";
import {FSWatcher, watch} from "chokidar";
import {JoyAppConfig} from "../../joy-server/server/joy-app-config";

type TScanOutModuleProviders = Map<string, { type: "ClassProvider" | "Configuration"; providers: Provider[] }>;

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

/**
 * todo 通过emit-manifest.json的hash值，判断是否需要扫描或者更新模块。
 * todo 如果判断是被删除了的模块。
 */
@Component()
export class FileScanner {

  private watchers: Map<string, FSWatcher> = new Map();
  private aggregated = {
    add: [] as string[],
    delete: [] as string[],
    change: [] as string[],
  }

  constructor(private readonly joyAppConfig: JoyAppConfig, private providerScanner: ProviderScanner, private emitSrcService: EmitSrcService) {
  }

  @AutowireHook({ type: HookType.Waterfall, parallel: false, async: true })
  private afterScanOutModuleHook: IHook;

  private cachedModules: Map<string, IScanOutModule> = new Map();

  public getCacheModuleByProviderName(providerName: TProviderName | TProviderName[]): IScanOutModule | undefined {
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
    Log.info("scan and analyze code");
    // todo 支持简化的前端或者后端目录结构， 例如：纯前端应用，src目录下直接展平client目录。
    let distClientDir = path.join(distDir, "./client");
    const distServerDir = path.join(distDir, "./server");
    if (!existsSync(distClientDir)) {
      distClientDir = path.join(distDir, "./pages");
    }

    if (existsSync(distClientDir)) {
      await this.scan(distClientDir, { contextType: ModuleContextTypeEnum.React });
    }
    if (existsSync(distServerDir)) {
      await this.scan(distServerDir, { contextType: ModuleContextTypeEnum.Server });
    }
  }

  public async scan(dir: string, options: ScanOptions = {}): Promise<void> {
    this.emitSrcService.updateEmitManifest(); // todo 移动到hot-reload中，统一在emit-all完成后，刷新数据。
    const existModuleKeys = Array.from(this.cachedModules.keys());
    const scanOutModuleKeys: string[] = [];

    // let watcher = this.watchers.get(dir)
    // if (!watcher) {
    //   watcher = watch(dir)
    //   this.watchers.set(dir, watcher)
    //   watcher.on('add', (filePath) => {
    //     console.log('>>>> add', filePath)
    //     this.aggregated.add.push(filePath)
    //   })
    //   watcher.on('change', (filePath) => {
    //     console.log('>>>> change', filePath)
    //   })
    //   watcher.on('unlink', (filePath) => {
    //     console.log(`File ${filePath} has been removed`)
    //
    //   })
    //   watcher.on('ready', () => {
    //     console.log('Initial scan src directory complete. Ready for changes')
    //   })
    // }

    await new Promise<void>((resolve, reject) => {
      glob("**/*.{js,jsx,ts,tsx}", { cwd: dir }, async (err, files) => {
        if (err) {
          reject(err);
        }
        if (files.length === 0) {
          resolve();
        }

        for (let i = 0; i < files.length; i++) {
          const filePath = files[i];
          const fullPath = path.resolve(dir, filePath);
          scanOutModuleKeys.push(fullPath);
          await this.scanFile(fullPath, options);
        }
        resolve();
      });
    });

    // const deleteModules = existModuleKeys.filter(
    //   (it) => it.startsWith(dir) &&  !scanOutModuleKeys.includes(it)
    // );
    // for (const deleteModule of deleteModules) {
    //   const cache = this.cachedModules.get(deleteModule);
    //   if (cache) {
    //     await this.afterScanOutModuleHook.call(cache);
    //     this.cachedModules.delete(deleteModule);
    //   }
    // }
  }

  public async scanFile(fullFilePath: string, options: ScanOptions = {}): Promise<IScanOutModule | undefined> {
    const { mount, contextType = ModuleContextTypeEnum.Server } = options;
    const emit = this.emitSrcService.getEmitInfo(fullFilePath);
    const emitHash = emit?.hash;
    const cached = this.cachedModules.get(fullFilePath);
    if (emitHash !== undefined && cached !== undefined && emitHash === cached.hash) {
      // this file has not been changed, do nothing
      return cached;
    }

    const requiredModule = require(fullFilePath);
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
    // const providers = await this.providerScanner.scan(moduleLoaded.module);
    scanOutModule.providerDefines = this.scanModule(scanOutModule.module);

    if (options?.onScanOutModule && options.onScanOutModule(scanOutModule)) {
      return undefined;
    }

    this.cachedModules.set(fullFilePath, scanOutModule);

    scanOutModule = await this.afterScanOutModuleHook.call(scanOutModule);

    // if (providers && providers.length > 0) {
    //   if (isAdd) {
    //     this.container.addProviders(providers);
    //   } else if (isModify) {
    //     providers.forEach((provider) => {
    //       this.container.replace(provider.id, provider);
    //     });
    //   } else if (isRemove) {
    //     providers.forEach((provider) => {
    //       this.container.delete(provider.id);
    //     });
    //   }
    // }
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
        const providers = this.providerScanner.scan(propValue as any);
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
