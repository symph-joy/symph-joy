import { ClassProvider, Component, InstanceWrapper, isClassProvider, Provider, Tap, TProviderName, Type } from "@symph/core";
import { IReactRoute, IRouteMeta, ReactRouter } from "@symph/react";
import { FileScanner, IScanOutModule } from "../../joy-server/server/scanner/file-scanner";
import { readFileSync } from "fs";
import { join } from "path";

import { FileGenerator, IGenerateFiles } from "../../plugin/file-generator";
import { handlebars } from "../../lib/handlebars";

export interface IJoyReactRouteBuild extends IReactRoute {
  // staticPathGenerator?: IRouteMeta["staticPathGenerator"];
  srcPath?: string;
}

/**
 * used in build phase
 */
@Component()
export class JoyReactRouterPlugin<T extends IJoyReactRouteBuild = IJoyReactRouteBuild> extends ReactRouter<T> {
  protected routesTemplate = handlebars.compile(readFileSync(join(__dirname, "./routes.handlebars"), "utf-8"));

  protected routesServerTemplate = handlebars.compile(readFileSync(join(__dirname, "./routes.server.handlebars"), "utf-8"));

  // constructor(
  //   // protected fileGenerator: FileGenerator,
  //   // protected fileScanner: FileScanner
  // ) {
  //   super();
  // }

  // protected fromRouteMeta(
  //   path: string,
  //   providerName: TProviderName,
  //   meta: IRouteMeta,
  //   useClass: Type
  // ): T {
  //   const routeObj = super.fromRouteMeta(path, providerName, meta, useClass);
  //
  //   let filePath: string | undefined;
  //   let exportKey: string | undefined
  //   if (providerName) {
  //     const scanModule = this.fileScanner.getCacheModuleByProviderName(providerName);
  //     filePath = scanModule?.resource;
  //   }
  //
  //   // if (!filePath) {
  //   //   throw new Error(
  //   //     `Route can't found src file, route path:${path}, providerId:${String(providerName)}. `
  //   //   );
  //   // }
  //   const buildRoute: IJoyReactRouteBuild = {
  //     ...routeObj,
  //     srcPath: filePath,
  //   };
  //   return this.extendBuildRoute(buildRoute);
  // }

  // protected extendBuildRoute(route: IJoyReactRouteBuild): T {
  //   return route as T;
  // }

  addBuildRouteProvider(resourcePath: string | undefined, provider: ClassProvider): T[] | undefined {
    const routes = super.addRouteProvider(provider);
    if (routes && routes.length > 0) {
      for (const route of routes) {
        route.srcPath = resourcePath;
      }
    }
    return routes;
  }

  protected addFromScanOutModule(scanOutmodule: IScanOutModule): boolean {
    if (!scanOutmodule.providerDefines || scanOutmodule.providerDefines.size === 0) {
      return false;
    }

    let hasRoute = false;
    scanOutmodule.providerDefines.forEach((providerDefine, exportKey) => {
      providerDefine.providers.forEach((provider) => {
        if (!(provider as ClassProvider).useClass) {
          return;
        }
        const classProvider = provider as ClassProvider;
        const routes = this.addBuildRouteProvider(scanOutmodule.resource, classProvider);
        hasRoute = hasRoute || !!(routes && routes.length);
      });
    });
    return hasRoute;
  }

  public removeModule(modulePath: string): T[] | undefined {
    const rmProviders = [];
    for (let i = 0; i < this.routes.length; i++) {
      const provider = this.routes[i];
      if (provider.srcPath === modulePath) {
        // this.routes.splice(i, 1);
        rmProviders.push(provider);
      }
    }
    if (rmProviders.length > 0) {
      rmProviders.forEach((r) => this.removeRoute(r.path));
    }
    return rmProviders;
  }

  @Tap()
  public async afterScanOutModuleHook(module: IScanOutModule) {
    if (module.isAdd) {
      this.addFromScanOutModule(module);
    } else if (module.isModify) {
      this.removeModule(module.path);
      this.addFromScanOutModule(module);
    } else if (module.isRemove) {
      this.removeModule(module.path);
    }
  }

  // @Tap()
  // protected async onRegisterProviderAfter(
  //   provider: Provider,
  //   instanceWrapper: InstanceWrapper
  // ) {
  //   if (!isClassProvider(provider)) {
  //     return;
  //   }
  //   const addedRoutes = this.addRouteProvider(provider);
  //   if (addedRoutes && addedRoutes.length > 0) {
  //   }
  // }
  //
  // @Tap()
  // protected async onReplaceProviderAfter(
  //   nextProvider: Provider,
  //   preProvider: Provider
  // ) {
  //   if (!isClassProvider(nextProvider)) {
  //     return;
  //   }
  //   this.replaceRouteProvider(nextProvider, preProvider.id);
  // }

  protected getClientRoutes(): T[] {
    return this.getRoutes();
  }

  @Tap()
  protected async onGenerateFiles(genFiles: IGenerateFiles) {
    const clientRoutes = this.getClientRoutes();
    const clientFileContent = this.routesTemplate({ routes: clientRoutes });
    // await this.fileGenerator.writeClientFile("./routes.js", clientFileContent);
    // await this.fileGenerator.writeFile("./react/client/routes.js", clientFileContent);
    genFiles["./react/client/routes.js"] = clientFileContent;

    const serverFileContent = this.routesServerTemplate({
      routes: clientRoutes,
    });
    // await this.fileGenerator.writeServerFile("./routes.js", serverFileContent);
    // await this.fileGenerator.writeFile("./react/server/routes.js", serverFileContent);
    genFiles["./react/server/routes.js"] = serverFileContent;
    return genFiles;
  }
}
