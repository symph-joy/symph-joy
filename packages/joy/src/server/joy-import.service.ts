import { isClassProvider, ProviderLifecycle, ProviderScanner, RegisterTap, TProviderName } from "@symph/core";
import { ConfigConfiguration, Configurable, ConfigValue } from "@symph/config";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import fs from "fs";
import path from "path";
import { FileScanner, IScanOutModule } from "../joy-server/server/scanner/file-scanner";
import { scriptName } from "yargs";

class ImportModuleSchema {
  module: string;
  mount?: string;
  dynamic?: boolean;
}

class ImportConfigSchema {
  from: string;
  reactModule?: string | boolean | ImportModuleSchema | ImportModuleSchema[];
  serverModule?: string | boolean | ImportModuleSchema | ImportModuleSchema[];
  routePrefix?: string;
  dynamic?: boolean;
}

@Configurable()
export class JoyImportService {
  @ConfigValue()
  public imports: ImportConfigSchema[];

  private hasInit = false;

  constructor(public joyReactRouterPlugin: JoyReactRouterPlugin, public providerScanner: ProviderScanner, public fileScanner: FileScanner, public joyAppConfig: JoyAppConfig) {}

  @RegisterTap()
  // onContextInitialized(): Promise<void> | void {
  // onDidProvidersRegister(): Promise<void> | void {
  // onDidServerInitialize(): Promise<void> | void {
  onWillJoyBuild(): Promise<void> | void {
    // if (!this.hasInit){
    //   this.hasInit = true
    this.loadImports();
    // }
  }

  public loadImports() {
    if (!this.imports || this.imports.length === 0) {
      return;
    }
    const importModules = [] as ImportModuleSchema[];

    for (const importConfig of this.imports) {
      let { from, dynamic, serverModule, reactModule, routePrefix } = importConfig;
      // let serverModulePath: string, reactModulePath: string;
      let fromPath = "";
      if (path.isAbsolute(from)) {
        fromPath = from;
      } else if (from[0] === ".") {
        fromPath = this.joyAppConfig.resolveAppDir(importConfig.from);
      } else {
        // it's a node_module package
        fromPath = path.dirname(require.resolve(path.join(from, "package.json")));
      }

      if (!fs.existsSync(fromPath)) {
        throw new Error(`Import(from:${from}) failed, the path(${fromPath}) is not exists, `);
      }
      const fromState = fs.lstatSync(fromPath);
      if (fromState.isFile()) {
        importModules.push({ module: fromPath, dynamic, mount: routePrefix });
      } else if (fromState.isDirectory()) {
        const packageJsonPath = path.join(fromPath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          let packageInfo: Record<string, unknown> = require(packageJsonPath);
          const { serverModule: pkgServerModule, reactModule: pkgReactModule } = packageInfo as { serverModule: string | boolean; reactModule: string | boolean };

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
        }

        function importModuleConfig(importModule: string | boolean | ImportModuleSchema | (ImportModuleSchema | string)[]) {
          if (!importModule) {
            return;
          }
          if (typeof importModule === "string") {
            importModules.push({ module: path.resolve(fromPath, importModule), dynamic, mount: routePrefix });
          } else if (Array.isArray(importModule) && importModule.length > 0) {
            importModule.forEach((item) => {
              if (typeof item === "string") {
                importModules.push({ module: path.resolve(fromPath, item), dynamic, mount: routePrefix });
              } else {
                importModules.push({ dynamic, mount: routePrefix, ...item, module: path.resolve(fromPath, item.module) });
              }
            });
          }
        }

        if (serverModule) {
          importModuleConfig(serverModule);
        }
        if (reactModule) {
          importModuleConfig(reactModule);
        }
      } else {
        throw new Error(`Unknown import: ${from}`);
      }
    }

    if (importModules.length > 0) {
      this.importModule(importModules);
    }
  }

  public importModule(importModules: ImportModuleSchema[]): void {
    importModules.forEach((importModule) => {
      this.fileScanner.scanFile(importModule.module, {
        onScanOutModule(scanOutModule: IScanOutModule): void | boolean {
          scanOutModule.path = importModule.module;
          scanOutModule.resource = importModule.module;
          scanOutModule.mount = importModule.mount;
        },
      });
    });
  }

  public importReact(configModulePath: string, importItem: ImportConfigSchema): void {
    const { dynamic } = importItem;
    const importModule = require(configModulePath);
    const providers = this.providerScanner.scan(importModule);
    if (!providers || providers.length === 0) {
      return;
    }
    for (const provider of providers) {
      if (isClassProvider(provider)) {
        const routes = this.joyReactRouterPlugin.scanProvider(provider);
        if (!routes || routes.length === 0) {
          continue;
        }
        for (const route of routes) {
          this.joyReactRouterPlugin.addRoute({
            ...route,
            srcPath: configModulePath,
            dynamic: dynamic,
          });
        }
      }
    }
  }

  public importServer(configModulePath: string, importItem: ImportConfigSchema): void {}
}
