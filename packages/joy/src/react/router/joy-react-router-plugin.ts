import { ClassComponent, Component, TComponent, RegisterTap } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";
import { IScanOutModule } from "../../build/scanner/file-scanner";
import { readFileSync } from "fs";
import { join, sep } from "path";

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

  private lastClientRoutesContent = "";
  private lastServerRoutesContent = "";

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
  //   const routeObj = super.fromRouteMeta(path, componentName, meta, useClass);
  //
  //   let filePath: string | undefined;
  //   let exportKey: string | undefined
  //   if (componentName) {
  //     const scanModule = this.fileScanner.getCacheModuleByComponentName(componentName);
  //     filePath = scanModule?.resource;
  //   }
  //
  //   // if (!filePath) {
  //   //   throw new Error(
  //   //     `Route can't found src file, route path:${path}, providerId:${String(componentName)}. `
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

  protected addFromScanOutModule(scanOutModule: IScanOutModule): T[] | undefined {
    if (scanOutModule.contextType !== ModuleContextTypeEnum.React || !scanOutModule.providerDefines || scanOutModule.providerDefines.size === 0) {
      return;
    }
    const scanOutRoutes = [] as T[];
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
            scanOutRoutes.push(route);
          }
        }
      });
    });
    return scanOutRoutes;
  }

  public removeModule(modulePath: string): T[] | undefined {
    let rmRoutes: T[] = [];
    for (const key of this.routesMap.keys()) {
      const route = this.routesMap.get(key);
      if (route && route.srcPath === modulePath) {
        rmRoutes.push(route);
      }
    }
    if (!rmRoutes.length) {
      return undefined;
    }
    for (const rmRoute of rmRoutes) {
      this.routesMap.delete(rmRoute.path);
    }
    this.refreshTree();
    return rmRoutes;
  }

  @RegisterTap()
  public async afterScanOutModuleHook(module: IScanOutModule) {
    if (module.isAdd) {
      this.addFromScanOutModule(module);
    } else if (module.isModify) {
      this.replaceModule(module);
    } else if (module.isRemove) {
      this.removeModule(module.resource || module.path);
    }
  }

  public replaceModule(module: IScanOutModule): void {
    this.removeModule(module.resource || module.path);
    this.addFromScanOutModule(module);
  }

  public getFsRoute(filePath: string, provider?: TComponent, basePath?: string): T | undefined {
    const pagesDir = this.joyAppConfig.resolvePagesDir();
    if (!filePath.startsWith(pagesDir)) {
      return undefined;
    }
    let routePath = filePath.substr(pagesDir.length);
    const pathSegments = routePath.split(sep).filter(Boolean);
    let lastSeg = pathSegments[pathSegments.length - 1];
    if (/\.\w+$/.test(lastSeg)) {
      lastSeg = lastSeg.slice(0, lastSeg.lastIndexOf("."));
      pathSegments[pathSegments.length - 1] = lastSeg;
    }
    const isContainer = lastSeg === "layout";
    if (isContainer) {
      pathSegments.pop();
    }
    const isIndex = lastSeg === "index";
    if (isIndex) {
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
      index: isIndex,
      componentName: provider?.name,
      componentPackage: provider?.package,
    } as T;

    return fsRoute;
  }

  private addFSRoute(scanOutModule: IScanOutModule, exportKey: string, provider: TComponent, basePath?: string): T | undefined {
    const filePath = scanOutModule.resource;
    if (!filePath) {
      return undefined;
    }
    const fsRoute = this.getFsRoute(filePath, provider, basePath);
    if (fsRoute) {
      this.addRoute(fsRoute);
    }
    return fsRoute;
  }

  protected getClientRoutes(): T[] {
    return this.getRoutes();
  }

  @RegisterTap()
  protected async onGenerateFiles(genFiles: IGenerateFiles) {
    const clientRoutes = this.getClientRoutes();
    const clientFileContent = this.routesTemplate({ children: clientRoutes });
    if (this.lastClientRoutesContent.length !== clientFileContent.length || this.lastClientRoutesContent !== clientFileContent) {
      genFiles["./react/client/routes.js"] = clientFileContent;
      this.lastClientRoutesContent = clientFileContent;
    }

    const serverFileContent = this.routesServerTemplate({
      children: clientRoutes,
    });
    if (this.lastServerRoutesContent.length !== serverFileContent.length || this.lastServerRoutesContent !== serverFileContent) {
      genFiles["./react/server/routes.js"] = serverFileContent;
      this.lastServerRoutesContent = serverFileContent;
    }

    return genFiles;
  }
}
