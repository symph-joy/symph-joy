import { Component, RegisterTap, TProviderName, Type } from "@symph/core";
import { IReactRoute, IRouteMeta } from "@symph/react";
import { IJoyReactRouteBuild, JoyReactRouterPlugin } from "./joy-react-router-plugin";

interface IReactRouteBuildDev extends IJoyReactRouteBuild {
  // srcPath?: string;
  isAdd?: boolean;
}

/**
 * used in dev build phase.
 */
@Component()
export class JoyReactRouterPluginDev extends JoyReactRouterPlugin<IReactRouteBuildDev> {
  // constructor(
  //   protected fileGenerator: FileGenerator,
  //   // protected fileScanner: FileScanner
  // ) {
  //   super(fileGenerator);
  // }

  protected createFromMeta(path: string, providerName: TProviderName, providerPackage: string | undefined, meta: IRouteMeta, useClass: Type): IReactRouteBuildDev {
    const route = super.createFromMeta(path, providerName, providerPackage, meta, useClass);
    return {
      ...route,
      isAdd: false,
    };
  }

  // protected extendBuildRoute(route: IJoyReactRouteBuild): IReactRouteBuildDev {
  //   return {
  //     ...route,
  //     isAdd: false,
  //   };
  // }

  protected mergeRouteExtendState(to: IReactRouteBuildDev, from: IReactRouteBuildDev) {
    to.isAdd = from.isAdd;
  }

  private plainRoutesTree(routes: IReactRouteBuildDev[]): IReactRouteBuildDev[] {
    const plainRoutes: any[] = [];
    const getFromRoutes = (rootRoutes: IReactRoute[]) => {
      if (!rootRoutes?.length) {
        return;
      }
      for (const route of rootRoutes) {
        plainRoutes.push(route);
        if (route.routes?.length) {
          getFromRoutes(route.routes);
        }
      }
    };
    getFromRoutes(routes);
    return plainRoutes;
  }

  public async getRouteFiles(pathname: string): Promise<string[] | undefined> {
    const matchedRoutes = this.getMatchedRoutes(pathname);
    if (!matchedRoutes || matchedRoutes.length === 0) {
      return;
    }

    const usedRoutes = matchedRoutes;
    const waitingRoutes: IReactRouteBuildDev[] = [];
    usedRoutes.forEach((route) => {
      waitingRoutes.push(route);
      if (!route.isAdd) {
        route.isAdd = true;
      }
    });
    if (waitingRoutes.length == 0) {
      return;
    }
    const routeFiles = waitingRoutes.map((r) => r.srcPath).filter(Boolean) as string[];

    return routeFiles;
  }

  // @RegisterTap()
  // async onBeforeRender({
  //   req,
  //   res,
  //   pathname,
  //   query,
  // }: {
  //   req: IncomingMessage;
  //   res: ServerResponse;
  //   pathname: string;
  //   query: ParsedUrlQuery;
  // }): Promise<void> {
  //
  // }

  // @RegisterTap()
  // protected async onGenerateFiles() {
  //   console.log(">>>> IReactRouteDev. onGenerateFiles");
  //   const clientRoutes = this.filterRoutes((route) => !!route.isAdd);
  //   const clientFileContent = this.routesTemplate({ routes: clientRoutes });
  //   await this.fileGenerator.writeClientFile("./routes.js", clientFileContent);
  //
  //   const serverFileContent = this.routesServerTemplate({ routes: clientRoutes });
  //   await this.fileGenerator.writeServerFile("./routes.js", serverFileContent);
  // }

  protected getClientRoutes(): IReactRouteBuildDev[] {
    function addedFilter(routes: IReactRouteBuildDev[]): IReactRouteBuildDev[] {
      const rst = [] as IReactRouteBuildDev[];
      for (const route of routes) {
        if (route.isAdd) {
          const copyRoute = { ...route };
          rst.push(copyRoute);
          if (route.routes) {
            copyRoute.routes = addedFilter(route.routes as IReactRouteBuildDev[]);
          }
        }
      }
      return rst;
    }
    const routes = this.getRoutes();
    return addedFilter(routes);
  }

  @RegisterTap()
  protected async addTmpGenerateWatcherPaths(watchPaths: string[]) {
    watchPaths.push("./src");
    return watchPaths;
  }
}
