import { ClassComponent, Component, ComponentName, IComponentLifecycle, isClassComponent, RegisterTap, TComponent, Type } from "@symph/core";
import { getReactControllerMeta, IReactRoute, IReactRouteMeta, ReactRoute, ReactRouterService } from "@symph/react";
import { IScanOutModule } from "../../build/scanner/file-scanner";
import { readFileSync } from "fs";
import path, { join, sep } from "path";
import { sync } from "resolve";
import { IGenerateFiles } from "../../build/file-generator";
import { handlebars } from "../../lib/handlebars";
import { ModuleContextTypeEnum } from "../../lib/constants";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { normalizeConventionRouteV6 } from "./router-utils";
import { getReactDynamicLoadMeta, ReactDynamicLoadMeta } from "../dynamic/react-dynamic-load.decorator";

export interface IJoyReactRouteBuild extends IReactRoute {
  // staticPathGenerator?: IRouteMeta["staticPathGenerator"];
  srcPath?: string;
  mount?: string;
  dynamicLoad?: ReactDynamicLoadMeta;
}

/**
 * used in build phase
 */
@Component()
export class JoyReactRouterPlugin<T extends IJoyReactRouteBuild = IJoyReactRouteBuild> extends ReactRouterService<T> implements IComponentLifecycle {
  protected routesTemplate = handlebars.compile(readFileSync(join(__dirname, "./routes-client.handlebars"), "utf-8"));

  protected routesServerTemplate = handlebars.compile(readFileSync(join(__dirname, "./routes-server.handlebars"), "utf-8"));

  private lastClientRoutesContent = "";
  private lastServerRoutesContent = "";

  constructor(
    protected joyAppConfig: JoyAppConfig // protected fileGenerator: FileGenerator, // protected fileScanner: FileScanner
  ) {
    super();
  }

  initialize(): Promise<void> | void {
    // 添加默认 404 页面
    const route404 = this.getDefault404Route();
    this.addRoute(route404);
  }

  protected getDefault404Route(): T {
    const page404Path = sync("../../pages/_error");
    return {
      path: "/404",
      componentName: "joyErrorComponent",
      srcPath: page404Path,
    } as IJoyReactRouteBuild as any;
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
        if (!routes?.length && scanOutModule.resource) {
          // 未自定义路由信息，尝试使用文件约定路由
          const fsRoute = this.addFSRoute(scanOutModule.resource, provider, scanOutModule.mount) as T | undefined;
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

  protected createFromMeta(
    path: string,
    providerName: ComponentName,
    providerPackage: string | undefined,
    meta: IReactRouteMeta,
    useClass: Type | Function
  ): T {
    const route = super.createFromMeta(path, providerName, providerPackage, meta, useClass);
    route.dynamicLoad = getReactDynamicLoadMeta(useClass);
    return route;
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
      this.removeRoute(rmRoute, false);
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

  public getFsRoute(filePath: string, basePath?: string): T | undefined {
    const pagesDir = this.joyAppConfig.resolvePagesDir();
    if (!filePath.startsWith(pagesDir)) {
      return undefined;
    }
    let routePath = filePath.slice(pagesDir.length);
    const pathSegments = routePath.split(sep).filter(Boolean);
    if (
      pathSegments.find((it) => {
        if (it.startsWith(".") || (it.startsWith("_") && !/^_layout\./i.test(it))) {
          // 以 . 或 _ 开头的文件或目录
          return true;
        }
        const lowerIt = it.toLowerCase();
        if (lowerIt === "components" || lowerIt === "component" || lowerIt === "utils" || lowerIt === "util") {
          return true;
        }
        return false;
      })
    ) {
      return undefined;
    }
    if (/(test|spec|e2e)\.(tsx?|jsx?)$/.test(routePath)) {
      // 测试文件
      return undefined;
    }

    let lastSeg = pathSegments[pathSegments.length - 1];
    if (/\.\w+$/.test(lastSeg)) {
      lastSeg = lastSeg.slice(0, lastSeg.lastIndexOf("."));
      pathSegments[pathSegments.length - 1] = lastSeg;
    }
    const isContainer = lastSeg === "_layout";
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

    const { path: norRoutePath, catchAllParam } = normalizeConventionRouteV6(routePath);
    const fsRoute = {
      path: norRoutePath,
      isContainer,
      index: isIndex,
      catchAllParam,
    } as IJoyReactRouteBuild as T;

    return fsRoute;
  }

  public addFSRoute(filePath: string, provider: TComponent, basePath?: string): T | undefined {
    if (!filePath) {
      return undefined;
    }
    const clazz = (provider as ClassComponent).useClass;
    const ctlMeta = getReactControllerMeta(clazz);
    if (!ctlMeta) {
      return;
    }
    const fsRoute = this.getFsRoute(filePath, basePath);
    if (fsRoute) {
      fsRoute.componentName = provider?.name;
      fsRoute.componentPackage = provider?.package;
      if (isClassComponent(provider)) {
        ReactRoute(fsRoute)(clazz);
      }
      fsRoute.dynamicLoad = getReactDynamicLoadMeta(clazz);
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

    const dynamicLoadRoutes = [] as T[];
    this.traverseTree(clientRoutes, (route) => {
      if (route.dynamicLoad) {
        // @ts-ignore
        route.__dynamicCompName = route.path.replace(/[^0-9a-zA-z_]/g, "_");
        const loading = route.dynamicLoad.loading;
        if (loading?.startsWith("/") || loading?.startsWith(".")) {
          const loadingModule = path.relative(route.srcPath!, loading);
        }
        dynamicLoadRoutes.push(route);
      }
      return false;
    });

    const clientFileContent = this.routesTemplate({ children: clientRoutes, dynamicLoadRoutes });
    if (this.lastClientRoutesContent.length !== clientFileContent.length || this.lastClientRoutesContent !== clientFileContent) {
      genFiles["./react/common/routes.js"] = clientFileContent;
      // genFiles["./react/client/routes.js"] = clientFileContent;
      this.lastClientRoutesContent = clientFileContent;
      // genFiles["./react/server/routes.js"] = clientFileContent;
    }

    // const serverFileContent = this.routesServerTemplate({
    //   children: clientRoutes,
    //   dynamicLoadRoutes,
    // });
    // if (this.lastServerRoutesContent.length !== serverFileContent.length || this.lastServerRoutesContent !== serverFileContent) {
    //   genFiles["./react/server/routes.js"] = serverFileContent;
    //   this.lastServerRoutesContent = serverFileContent;
    // }

    return genFiles;
  }
}
