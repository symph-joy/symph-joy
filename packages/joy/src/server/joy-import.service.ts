import { Component, ProviderScanner, RegisterTap } from "@symph/core";
import { Value } from "@symph/config";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import fs from "fs";
import path from "path";
import { FileScanner, IScanOutModule } from "../build/scanner/file-scanner";
import { ModuleContextTypeEnum } from "../lib/constants";
import { ApiSrcEntryGenerator } from "../build/api-src-entry-generator";

type TImportModule = {
  module: string;
  contextType: ModuleContextTypeEnum;
  mount: string;
  dynamic: boolean;
};

class ImportModuleSchema {
  module: string;
  mount?: string;
  dynamic?: boolean;
}

class ImportConfigSchema {
  from: string;
  reactModule?: string | boolean | ImportModuleSchema | ImportModuleSchema[];
  serverModule?: string | boolean | ImportModuleSchema | ImportModuleSchema[];
  mount?: string;
  dynamic?: boolean;
}

@Component()
export class JoyImportService {
  @Value()
  public imports: ImportConfigSchema[];

  private hasInit = false;

  constructor(
    public joyReactRouterPlugin: JoyReactRouterPlugin,
    public providerScanner: ProviderScanner,
    public fileScanner: FileScanner,
    public joyAppConfig: JoyAppConfig,
    public apiSrcEntryGenerator: ApiSrcEntryGenerator
  ) {}

  @RegisterTap()
  // onContextInitialized(): Promise<void> | void {
  // onDidProvidersRegister(): Promise<void> | void {
  // onDidServerInitialize(): Promise<void> | void {
  onWillJoyBuild(): Promise<void> | void {
    // if (!this.hasInit){
    //   this.hasInit = true
    if (this.imports && this.imports.length > 0) {
      this.loadImports(this.imports);
    }

    // }
  }

  public findImportModules(imports: ImportConfigSchema[]): TImportModule[] {
    const importModules = [] as TImportModule[];
    for (const importConfig of imports) {
      let { from, dynamic = false, serverModule, reactModule, mount = "" } = importConfig;
      // let serverModulePath: string, reactModulePath: string;
      let fromPath = "";
      if (path.isAbsolute(from)) {
        fromPath = from;
      } else if (from[0] === ".") {
        fromPath = this.joyAppConfig.resolveAppDir(importConfig.from);
      } else {
        // it's maybe a node_module package
        fromPath = path.dirname(require.resolve(path.join(from, "package.json")));
      }

      if (!fs.existsSync(fromPath)) {
        throw new Error(`Import(from:${from}) failed, the path(${fromPath}) is not exists, `);
      }
      let fromFile = fromPath;
      const fromState = fs.statSync(fromPath);
      if (fromState.isDirectory()) {
        fromFile = path.join(fromPath, "package.json");
      }

      const extname = path.extname(fromFile);
      if (/\.js$|\.ts$/i.test(extname)) {
        importModules.push({ module: fromFile, dynamic, mount, contextType: ModuleContextTypeEnum.Server });
      } else if (/\.json$/i.test(extname)) {
        let packageInfo: Record<string, unknown> = require(fromFile);
        const joyExports = packageInfo.joyExports;
        const { serverModule: pkgServerModule, reactModule: pkgReactModule, imports: pkgImports, mount: pkgMount } = joyExports as {
          serverModule?: string | boolean;
          reactModule?: string | boolean;
          imports?: ImportConfigSchema[];
          mount?: string;
        };
        if (!mount && pkgMount) {
          mount = pkgMount;
        }
        if (pkgImports && pkgImports.length) {
          const pkgImportModules = this.findImportModules(pkgImports);
          if (pkgImportModules && pkgImportModules.length) {
            importModules.push(...pkgImportModules);
          }
        }

        if (serverModule === undefined || serverModule === null || serverModule === true) {
          if (pkgServerModule) {
            serverModule = pkgServerModule;
          }
        }

        if (reactModule === undefined || reactModule === null || reactModule === true) {
          if (pkgReactModule) {
            reactModule = pkgReactModule;
          }
        }

        function importModuleConfig(
          contextType: ModuleContextTypeEnum,
          importModule: string | boolean | ImportModuleSchema | (ImportModuleSchema | string)[]
        ) {
          if (!importModule) {
            return;
          }
          if (typeof importModule === "string") {
            importModules.push({ module: path.resolve(fromPath, importModule), dynamic, mount, contextType });
          } else if (Array.isArray(importModule) && importModule.length > 0) {
            importModule.forEach((item) => {
              if (typeof item === "string") {
                importModules.push({ module: path.resolve(fromPath, item), dynamic, mount, contextType });
              } else {
                importModules.push({ dynamic, mount, ...item, contextType, module: path.resolve(fromPath, item.module) });
              }
            });
          }
        }

        if (serverModule) {
          importModuleConfig(ModuleContextTypeEnum.Server, serverModule);
        }
        if (reactModule) {
          importModuleConfig(ModuleContextTypeEnum.React, reactModule);
        }
      } else {
        throw new Error(`Unknown import: ${from}`);
      }
    }
    return importModules;
  }

  public async loadImports(imports: ImportConfigSchema[]): Promise<void> {
    const importModules = this.findImportModules(imports);

    if (importModules && importModules.length > 0) {
      await this.importModule(importModules);
    }
  }

  // TODO dynamic 属性未实现
  public async importModule(importModules: TImportModule[]): Promise<void> {
    for (const importModule of importModules) {
      const { contextType, mount, module } = importModule;
      if (contextType === ModuleContextTypeEnum.Server) {
        this.apiSrcEntryGenerator.registerModule(mount, module);
      }
      await this.fileScanner.scanFile(module, {
        contextType: contextType,
        mount: mount,
        onScanOutModule(scanOutModule: IScanOutModule): void | boolean {
          scanOutModule.path = module;
          scanOutModule.resource = module;
          scanOutModule.mount = mount;
        },
      });
    }
  }
}
