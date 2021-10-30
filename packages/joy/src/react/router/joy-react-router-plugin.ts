import { ClassProvider, Component, Provider, RegisterTap } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";
import { IScanOutModule } from "../../build/scanner/file-scanner";
import { readFileSync } from "fs";
import { join } from "path";

import { IGenerateFiles } from "../../build/file-generator";
import { handlebars } from "../../lib/handlebars";
import { ModuleContextTypeEnum } from "../../lib/constants";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { normalizeConventionRoute } from "./router-utils";

export interface IJoyReactRouteBuild extends IReactRoute {
  // staticPathGenerator?: IRouteMeta["staticPathGenerator"];
  srcPath?: string;
  mount?: string;
}

/**
 * used in build phase
 */
@Component()
export class JoyReactRouterPlugin<T extends IJoyReactRouteBuild = IJoyReactRouteBuild> extends ReactRouter<T> {
  protected routesTemplate = handlebars.compile(readFileSync(join(__dirname, "./routes-client.handlebars"), "utf-8"));

  protected routesServerTemplate = handlebars.compile(readFileSync(join(__dirname, "./routes-server.handlebars"), "utf-8"));

  constructor(
    protected joyAppConfig: JoyAppConfig // protected fileGenerator: FileGenerator, // protected fileScanner: FileScanner
  ) {
    super();
  }

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

  protected addFromScanOutModule(scanOutModule: IScanOutModule): boolean {
    if (scanOutModule.contextType !== ModuleContextTypeEnum.React || !scanOutModule.providerDefines || scanOutModule.providerDefines.size === 0) {
      return false;
    }
    let hasRoute = false;
    scanOutModule.providerDefines.forEach((providerDefine, exportKey) => {
      providerDefine.providers.forEach((provider) => {
        let routes = this.addRouteProvider(provider, scanOutModule.mount);
        if (!routes?.length) {
          // 未自定义路由信息，尝试使用文件约定路由
          const fsRoute = this.addFSRoute(scanOutModule, exportKey, provider, scanOutModule.mount) as T | undefined;
          if (fsRoute) {
            routes = [fsRoute];
          }
        }

        if (routes && routes.length > 0) {
          for (const route of routes) {
            route.srcPath = scanOutModule.resource;
            route.mount = scanOutModule.mount;
          }
        }

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

  @RegisterTap()
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

  private addFSRoute(scanOutModule: IScanOutModule, exportKey: string, provider: Provider, basePath?: string): T | undefined {
    const filePath = scanOutModule.resource;
    if (!filePath) {
      return undefined;
    }
    const pagesDir = this.joyAppConfig.resolvePagesDir();
    if (!filePath.startsWith(pagesDir)) {
      return undefined;
    }
    let exact = true;
    let routePath = filePath.substr(pagesDir.length);
    const pathSegments = routePath.split("/").filter(Boolean);
    let lastSeg = pathSegments[pathSegments.length - 1];
    if (lastSeg.includes(".")) {
      lastSeg = lastSeg.slice(0, lastSeg.indexOf("."));
      pathSegments[pathSegments.length - 1] = lastSeg;
    }
    const isContainer = lastSeg === "layout";
    if (isContainer) {
      exact = false;
      pathSegments.pop();
    }
    routePath = "/" + pathSegments.join("/");
    if (basePath) {
      routePath = basePath + routePath;
    }
    routePath = normalizeConventionRoute(routePath);
    const fsRoute = {
      path: routePath,
      isContainer,
      exact,
      providerName: provider.name,
      providerPackage: provider.package,
    } as T;
    this.addRoute(fsRoute);
    return fsRoute;
  }

  protected getClientRoutes(): T[] {
    return this.getRoutes();
  }

  @RegisterTap()
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
