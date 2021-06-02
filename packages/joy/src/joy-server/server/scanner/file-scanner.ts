import glob from "glob";
import path from "path";
import {
  CoreContext,
  Hook,
  HookPipe,
  HookType,
  Injectable,
  JoyContainer,
  Provider,
  ProviderScanner,
} from "@symph/core";
import { EmitSrcService } from "../../../build/webpack/plugins/emit-src-plugin/emit-src-service";

interface IModuleLoaded {
  path: string; // build dist file path
  resource: string | undefined; // source file path
  module: Record<string, unknown>;
  providers?: Provider[];
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
  private afterModuleLoadHook: HookPipe;

  private cachedModules: Map<string, IModuleLoaded> = new Map();

  public getCacheModuleByProviderId(
    providerId: string
  ): IModuleLoaded | undefined {
    const moduleKeys = new Array(...this.cachedModules.keys());
    for (let i = 0; i < moduleKeys.length; i++) {
      const key = moduleKeys[i];
      const cacheModule = this.cachedModules.get(key);
      if (!cacheModule) {
        continue;
      }
      const findOutProvider = cacheModule.providers?.find(
        (p) => p.id === providerId
      );
      if (findOutProvider) {
        return cacheModule;
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
    return new Promise((resolve, reject) => {
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

          const isAdd = !cached;
          const isModify = !!cached;
          const isRemove = false;

          let moduleLoaded: IModuleLoaded = {
            path: fullPath,
            resource: emit?.resource,
            module: requiredModule,
            isAdd,
            isModify,
            isRemove,
            hash: emitHash,
          };
          moduleLoaded = await this.afterModuleLoadHook.call(moduleLoaded);
          if (!requiredModule) {
            continue;
          }
          const providers = await this.providerScanner.scan(
            moduleLoaded.module
          );
          moduleLoaded.providers = providers;
          this.cachedModules.set(fullPath, moduleLoaded);

          if (providers && providers.length > 0) {
            if (isAdd) {
              this.container.addProviders(providers);
            } else if (isModify) {
              providers.forEach((provider) => {
                this.container.replace(provider.id, provider);
              });
            } else if (isRemove) {
              providers.forEach((provider) => {
                this.container.delete(provider.id);
              });
            }
          }
        }
        resolve();
      });
    });
  }
}
