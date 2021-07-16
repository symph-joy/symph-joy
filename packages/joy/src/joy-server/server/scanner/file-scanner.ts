import glob from "glob";
import path from "path";
import {
  CoreContext,
  getConfigurationMeta,
  getInjectableMeta,
  Hook,
  HookPipe,
  HookType,
  Injectable,
  JoyContainer,
  Provider,
  ProviderScanner,
  Type,
} from "@symph/core";
import { EmitSrcService } from "../../../build/webpack/plugins/emit-src-plugin/emit-src-service";
import { isFunction, isNil } from "@symph/core/dist/utils/shared.utils";
import { INJECTABLE_METADATA } from "@symph/core/dist/constants";

type TScanOutModuleProviders = Map<
  string,
  { type: "ClassProvider" | "Configuration"; providers: Provider[] }
>;

export interface IScanOutModule {
  path: string; // build dist file path
  resource: string | undefined; // source file path
  module: Record<string, unknown>;
  providerDefines?: TScanOutModuleProviders;
  isAdd?: boolean;
  isModify?: boolean;
  isRemove?: boolean;
  hash?: string;
}

/**
 * todo 通过emit-manifest.json的hash值，判断是否需要扫描或者更新模块。
 * todo 如果判断是被删除了的模块。
 */
@Injectable()
export class FileScanner {
  private container: JoyContainer;

  constructor(
    private readonly tempoContext: CoreContext,
    private providerScanner: ProviderScanner,
    private emitSrcService: EmitSrcService
  ) {
    this.container = tempoContext.container;
  }

  @Hook({ type: HookType.Bail, parallel: false, async: true })
  private afterScanOutModuleHook: HookPipe;

  private cachedModules: Map<string, IScanOutModule> = new Map();

  public getCacheModuleByProviderId(
    providerId: string
  ): IScanOutModule | undefined {
    const moduleKeys = new Array(...this.cachedModules.keys());
    for (let i = 0; i < moduleKeys.length; i++) {
      const key = moduleKeys[i];
      const cacheModule = this.cachedModules.get(key);
      if (!cacheModule || !cacheModule.providerDefines) {
        continue;
      }
      for (const providerDefine of cacheModule.providerDefines.values()) {
        const findOutProvider = providerDefine.providers?.find(
          (p) => p.id === providerId
        );
        if (findOutProvider) {
          return cacheModule;
        }
      }
    }
    return undefined;
  }

  public getSourceFileByProviderId(providerId: string): string | undefined {
    const cacheModule = this.getCacheModuleByProviderId(providerId);
    if (cacheModule) {
      return cacheModule.resource;
    }
    return undefined;
  }

  public async scan(dir: string): Promise<void> {
    this.emitSrcService.updateEmitManifest(); // todo 移动到hot-reload中，统一在emit-all完成后，刷新数据。
    const existModuleKeys = Array.from(this.cachedModules.keys());
    const scanOutModuleKeys: string[] = [];
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
          const emit = this.emitSrcService.getEmitInfo(fullPath);
          const emitHash = emit?.hash;
          const cached = this.cachedModules.get(fullPath);
          if (
            emitHash !== undefined &&
            cached !== undefined &&
            emitHash === cached.hash
          ) {
            // this file has not been changed, do nothing
            continue;
          }

          const requiredModule = require(fullPath);
          if (!requiredModule) {
            continue;
          }

          const isAdd = !cached;
          const isModify = !!cached;
          const isRemove = false; // todo 实现remove逻辑

          let moduleLoaded: IScanOutModule = {
            path: fullPath,
            resource: emit?.resource,
            module: requiredModule,
            isAdd,
            isModify,
            isRemove,
            hash: emitHash,
          };
          // const providers = await this.providerScanner.scan(moduleLoaded.module);
          moduleLoaded.providerDefines = this.scanModule(moduleLoaded.module);
          this.cachedModules.set(fullPath, moduleLoaded);

          moduleLoaded = await this.afterScanOutModuleHook.call(moduleLoaded);

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
        }
        resolve();
      });
    });

    const deleteModules = existModuleKeys.filter(
      (it) => !scanOutModuleKeys.includes(it)
    );
    for (const deleteModule of deleteModules) {
      const cache = this.cachedModules.get(deleteModule);
      if (cache) {
        await this.afterScanOutModuleHook.call(cache);
        this.cachedModules.delete(deleteModule);
      }
    }
  }

  public scanModule(
    mod: Record<string, unknown>
  ): undefined | TScanOutModuleProviders {
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
        } else if (getInjectableMeta(propValue)) {
          // 2. provider class
          providerDefines.set(prop, { type: "ClassProvider", providers });
        }
      }
    });
    return providerDefines;
  }
}
