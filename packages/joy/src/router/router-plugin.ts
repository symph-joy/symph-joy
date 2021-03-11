import {
  ClassProvider,
  InstanceWrapper,
  isClassProvider,
  Provider,
  Tap,
} from "@symph/core";
import { JoyAppConfig } from "../next-server/server/joy-config/joy-app-config";
import { FileGenerator } from "../plugin/file-generator";
import { CollectionOf, MinLength } from "@tsed/schema";
import { ConfigValue } from "../next-server/server/joy-config/config-value.decorator";
import { IJoyPlugin } from "../plugin/joy-plugin.interface";
import { JoyPlugin } from "../plugin/joy-plugin.decorator";
import { FileScanner } from "../next-server/server/scanner/file-scanner";
import handlebars from "handlebars";
import { readFileSync } from "fs";
import { join } from "path";
import { NextDevServer } from "../server/next-dev-server";
import { JoyHooks } from "../interface/hooks.interface";
import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import { getMatchedRoutes } from "./router-utils";
import { getRouteMeta, IReactRoute } from "@symph/react";
// import {ReactRouteInterface} from "../router/react-route.interface";

// export function ConfigValue<T extends any>(configOptions?: Partial<IJoyConfigMeta<T>>): PropertyDecorator {
//   return (target, propertyKey) => {
//     // const validSchemaPropKey = `__joy_config_schema_${propertyKey as string}`
//     // function addSchema(): any{
//     //   return configOptions?.schema || {'schemaTest': 'aaaaaaa'}
//     // }
//     // target.constructor.prototype[validSchemaPropKey] = addSchema
//     //
//     // // 注册tap，添加到全局的config schema中
//     // Tap( {hookId: 'addConfigSchema'})(target, validSchemaPropKey)
//
//     // 声明一个配置项，当实例在初始化是，绑定joyConfig中的值到当前provider中
//     const configMeta: IJoyConfigMeta<T> = Object.assign({
//       key: propertyKey as string,
//       onChange:  'reload',
//       schema: undefined
//     }, configOptions)
//
//     const existConfigs = getConfigMetadata(target) || []
//     existConfigs.push(configMeta)
//
//     Reflect.defineMetadata(REFLECT_KEY_CONFIG, existConfigs, target)
//   };
// }

const routesTemplate = handlebars.compile(
  readFileSync(join(__dirname, "./routes.handlebars"), "utf-8")
);

// interface ReactRouteInterface {
//   path: string;
//   providerId: string
//   // dynamic: boolean
// }

class RouteConfig {
  @MinLength(3)
  public path: string;
}

type TReactRoute = IReactRoute & {
  filePath?: string;
  compileStatus?: string;
  lastActiveTime?: number;
};

@JoyPlugin()
export class RouterPlugin implements IJoyPlugin, JoyHooks {
  name = "router-plugin";
  version = "v1.0.0";

  constructor(
    private joyDevServer: NextDevServer,
    private fileGenerator: FileGenerator,
    private fileScanner: FileScanner,
    private config: JoyAppConfig
  ) {}

  @ConfigValue({ configKey: "routes", onChange: "reload" })
  @CollectionOf(RouteConfig)
  public routesConfig: RouteConfig[];

  protected routesMap = new Map<string, TReactRoute>(); // route path is the map key
  protected allRouteTree: TReactRoute[] = []; // list方式存放路由，因为路由需要排序

  protected clientRouteTree: TReactRoute[] = []; // 客户端路由，在开发调试时，客户端是增量编译的。

  // onConfigChange(config: JoyAppConfig, configKeys: string[]): JoyAppConfig {
  //   return config
  // }

  // @ConfigValue()
  // // @MaxLength(5)
  // private path: string

  // @Tap()
  // private async afterModuleLoadHook(moduleLoaded: any) {
  //   console.log('>>>> RouterPlugin. afterModuleLoad', moduleLoaded)
  // }

  private plainRoutesTree(routes: TReactRoute[]): TReactRoute[] {
    const plainRoutes: any[] = [];
    const getRouteProviders = (rootRoutes: IReactRoute[]) => {
      if (!rootRoutes?.length) {
        return;
      }
      rootRoutes.forEach((route) => {
        plainRoutes.push(route);
        if (route.routes?.length) {
          getRouteProviders(route.routes);
        }
      });
    };
    getRouteProviders(routes);
    return plainRoutes;
  }

  /**
   * 将一个路由，注册到路由树中
   * todo 严格按照路由的层级结构，管理路由树
   * todo 添加到同一层级的路由进行排序
   * @param rootTree
   * @param route
   * @param autoReplace 如果存在，是否自动替换，或者抛出错误。
   * @private
   */
  private addToRouteTree(
    rootTree: TReactRoute[],
    route: TReactRoute,
    { autoReplace }: { autoReplace: boolean } = { autoReplace: false }
  ) {
    const routePath = route.path as string;

    const addToChildrenRoutes = (rootRoutes: IReactRoute[]): boolean => {
      for (let i = 0; i < rootRoutes.length; i++) {
        const r = rootRoutes[i];
        const curPath = r.path as string;
        if (curPath === routePath) {
          // has existed
          if (autoReplace) {
            rootRoutes.splice(i, 1, route);
            return true;
          } else {
            throw new Error(`route (${route.path}) has existed`);
          }
        }
        if ((r.path as string).startsWith(routePath)) {
          let hasAddToChildren = false;
          if (r.routes?.length) {
            hasAddToChildren = addToChildrenRoutes(r.routes);
          } else {
            r.routes = [];
          }
          if (hasAddToChildren) {
            r.routes.push(route);
            return true;
          }
        }
      }
      return false;
    };
    if (!addToChildrenRoutes(rootTree)) {
      rootTree.push(route);
    }
  }

  private removeInRouteTree(rootTree: TReactRoute[], routePath: string) {
    const removeInChildren = (
      rootRoutes: IReactRoute[]
    ): TReactRoute | undefined => {
      for (let i = 0; i < rootRoutes.length; i++) {
        const r = rootRoutes[i];
        const curPath = r.path as string;
        if (curPath === routePath) {
          rootRoutes.splice(i, 1);
          return r;
        }

        if ((r.path as string).startsWith(routePath)) {
          let delItem;
          if (r.routes?.length) {
            delItem = removeInChildren(r.routes);
          }
          if (delItem) {
            return delItem;
          }
        }
      }
      return;
    };

    return removeInChildren(rootTree);
  }

  private removeRoutesByProviderId(providerId: string) {
    for (const key of this.routesMap.keys()) {
      const exited = this.routesMap.get(key);

      if (exited?.providerId !== providerId) {
        continue;
      }
      const path = exited.path as string;
      this.routesMap.delete(key);
      this.removeInRouteTree(this.allRouteTree, path);
      this.removeInRouteTree(this.clientRouteTree, path);
    }
  }

  @Tap()
  async onBeforeRender({
    req,
    res,
    pathname,
    query,
  }: {
    req: IncomingMessage;
    res: ServerResponse;
    pathname: string;
    query: ParsedUrlQuery;
  }): Promise<void> {
    // const reactRouter = await appContext.get<JoyReactRouterServerDev>(JoyReactRouterServerDev)
    // const matchedRoutes = reactRouter!.getMatchedRoutes('/hello')
    const matchedRoutes = getMatchedRoutes(pathname, this.allRouteTree);
    if (!matchedRoutes?.length) {
      return;
    }

    const addRoutes = this.plainRoutesTree(matchedRoutes);
    addRoutes.forEach((route) => {
      this.addToRouteTree(this.clientRouteTree, route, { autoReplace: true });
    });
    const routeFiles = addRoutes
      .map((r) => r.filePath)
      .filter(Boolean) as string[];
    await this.joyDevServer.ensureModules(routeFiles);
    console.log(">> router plugin, ensureModules:", routeFiles);
  }

  public addRoute(route: TReactRoute) {
    const { path } = route;

    const addRouteItem = (path: string, route: TReactRoute) => {
      const exited = this.routesMap.get(path);
      if (exited) {
        throw new Error(`Route ${path} has exist`);
      }
      if (route.providerId) {
        const srcFilePath = this.fileScanner.getSourceFileByProviderId(
          route.providerId
        );
        if (srcFilePath) {
          // is from file scanner
          // const relativePath = this.config.getAppRelativeDir(srcFilePath)
          const relativePath = srcFilePath; // todo 切换为，使用相对于项目根目录的相对路径
          route.filePath = relativePath;
        }
      }
      this.routesMap.set(path, route);
      this.addToRouteTree(this.allRouteTree, route);
    };

    if (Array.isArray(path)) {
      for (let i = 0; i < path.length; i++) {
        addRouteItem(path[i], route);
      }
    } else if (typeof path === "string") {
      addRouteItem(path, route);
    } else {
      throw new Error(
        `add route error, the path is nil: ${JSON.stringify(route)}`
      );
    }
  }

  private scanProvider(provider: ClassProvider) {
    const { useClass, id } = provider;
    const routeMeta = getRouteMeta(useClass);
    if (!routeMeta) {
      return;
    }
    if (Array.isArray(routeMeta.path)) {
      routeMeta.path?.forEach((path) => {
        const route: TReactRoute = {
          path: path,
          providerId: id,
        };
        this.addRoute(route);
      });
    } else if (typeof routeMeta.path === "string") {
      const route: TReactRoute = {
        path: routeMeta.path,
        providerId: id,
      };
      this.addRoute(route);
    }
    console.log(">>>> RouterPlugin. onRegisterProviderAfter", provider);
  }

  @Tap()
  private async onRegisterProviderAfter(
    provider: Provider,
    instanceWrapper: InstanceWrapper
  ) {
    if (!isClassProvider(provider)) {
      return;
    }
    this.scanProvider(provider);
    console.log(">>>> RouterPlugin. onRegisterProviderAfter", provider);
  }

  @Tap()
  private async onReplaceProviderAfter(
    nextProvider: Provider,
    beforeProvider: Provider
  ) {
    if (!isClassProvider(nextProvider)) {
      return;
    }
    const { id } = nextProvider;
    this.removeRoutesByProviderId(id);
    this.scanProvider(nextProvider);
  }

  @Tap()
  private async onGenerateFiles() {
    console.log(">>>> RouterPlugin. onGenerateFiles");
    const routeList: TReactRoute[] = [];
    this.routesMap.forEach((route, key) => {
      routeList.push(route);
    });
    const serverFileContent = routesTemplate({ routes: routeList });
    await this.fileGenerator.writeServerFile("./routes.js", serverFileContent);

    const clientRoutes = this.plainRoutesTree(this.clientRouteTree);
    const clientFileContent = routesTemplate({ routes: clientRoutes });
    await this.fileGenerator.writeClientFile("./routes.js", clientFileContent);
  }

  @Tap()
  private async addTmpGenerateWatcherPaths(watchPaths: string[]) {
    watchPaths.push("./src");
    return watchPaths;
  }

  async getRoutes() {}

  async scanControllerRoutes() {}
}
