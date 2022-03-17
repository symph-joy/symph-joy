import { Component, RegisterTap, ComponentName, Type } from "@symph/core";
import { IReactRoute, IReactRouteMeta } from "@symph/react";
import { IJoyReactRouteBuild, JoyReactRouterPlugin } from "./joy-react-router-plugin";
import { IScanOutModule } from "../../build/scanner/file-scanner";

interface IReactRouteBuildDev extends IJoyReactRouteBuild {
  // srcPath?: string;
  isAdd?: boolean;
}

/**
 * used in dev build phase.
 */
@Component()
export class JoyReactRouterPluginDev extends JoyReactRouterPlugin<IReactRouteBuildDev> {
  public replaceModule(module: IScanOutModule): void {
    const removed = this.removeModule(module.resource || module.path);
    const hasAdd = removed?.find((it) => it.isAdd);
    const added = this.addFromScanOutModule(module);
    if (added?.length && hasAdd) {
      added.forEach((it) => (it.isAdd = true));
    }
  }

  protected createFromMeta(
    path: string,
    componentName: ComponentName,
    providerPackage: string | undefined,
    meta: IReactRouteMeta,
    useClass: Type
  ): IReactRouteBuildDev {
    const route = super.createFromMeta(path, componentName, providerPackage, meta, useClass);
    return {
      ...route,
      isAdd: false,
    };
  }

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
        if (route.children?.length) {
          getFromRoutes(route.children);
        }
      }
    };
    getFromRoutes(routes);
    return plainRoutes;
  }

  protected getClientRoutes(): IReactRouteBuildDev[] {
    return super.getClientRoutes();
    // function addedFilter(routes: IReactRouteBuildDev[]): IReactRouteBuildDev[] {
    //   const rst = [] as IReactRouteBuildDev[];
    //   for (const route of routes) {
    //     if (route.isAdd) {
    //       const copyRoute = { ...route };
    //       rst.push(copyRoute);
    //       if (route.children) {
    //         copyRoute.children = addedFilter(route.children as IReactRouteBuildDev[]);
    //       }
    //     }
    //   }
    //   return rst;
    // }
    // const routes = this.getRoutes();
    // return addedFilter(routes);
  }

  @RegisterTap()
  protected async addTmpGenerateWatcherPaths(watchPaths: string[]) {
    watchPaths.push("./src");
    return watchPaths;
  }
}
