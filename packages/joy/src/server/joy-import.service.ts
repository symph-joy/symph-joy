import { isClassProvider, ProviderLifecycle, ProviderScanner, TProviderName } from "@symph/core";
import { Configurable, ConfigValue } from "@symph/config";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { isAbsolute } from "path";

class ImportModule {
  from: string;
  dynamic?: boolean;
}

@Configurable()
export class JoyImportService implements ProviderLifecycle {
  @ConfigValue()
  public imports: ImportModule[];

  constructor(public joyReactRouterPlugin: JoyReactRouterPlugin, public providerScanner: ProviderScanner, public joyAppConfig: JoyAppConfig) {}

  initialize(): Promise<void> | void {
    this.loadImports();
  }

  public loadImports(): TProviderName[] {
    let providerNames = [] as TProviderName[];
    if (!this.imports || this.imports.length === 0) {
      return providerNames;
    }
    for (const importItem of this.imports) {
      const { from, dynamic } = importItem;
      let packagePath: string;
      if (isAbsolute(from)) {
        packagePath = from;
      } else if (from[0] === ".") {
        packagePath = this.joyAppConfig.resolveAppDir(importItem.from);
      } else {
        // it's a node_module package
        packagePath = from;
      }
      const importModule = require(packagePath);
      const providers = this.providerScanner.scan(importModule);
      if (!providers || providers.length === 0) {
        continue;
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
              srcPath: packagePath,
              dynamic: importItem.dynamic,
            });
          }
        }
      }
    }
    return providerNames;
  }
}
