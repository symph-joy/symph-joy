import { IReactRoute } from "../interfaces";
import { matchPath } from "react-router";
import { ClassProvider } from "@symph/core";
import { getRouteMeta } from "./react-route.decorator";

export class ReactRouter<T extends IReactRoute = IReactRoute> {
  protected routes: T[] = [];

  public getRoutes(): T[] {
    return this.routes;
  }

  public setRoutes(routes: T[]): void {
    this.routes = routes;
  }

  /**
   * 获取页面路由，不包含layout路由。
   * 用于：
   * 1. 页面渲染和统计。
   */
  public getPageRoutes(): T[] {
    return this.routes;
  }

  public hasExist(path: string): boolean {
    return !!this.routes.find((v) => v.path === path);
  }

  public addRoute(route: T) {
    if (this.hasExist(route.path as string)) {
      throw new Error(`route (${route.path}) has existed`);
    }
    console.log(">>>> ReactRouter. addRoute", route);
    this.routes.push(route);
  }

  public filterRoutes(predicate: (route: T) => boolean) {
    return this.routes.filter(predicate);
  }

  public traverse(visitor: (route: T) => boolean) {
    for (let i = 0; i < this.routes.length; i++) {
      if (visitor(this.routes[i])) {
        break;
      }
    }
  }

  public removeRoute(routePath: string): T | undefined {
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (route.path === routePath) {
        this.routes.splice(i, 1);
        return route;
      }
    }
  }

  public getMatchedRoutes(pathname: string): T | undefined {
    // routes = routes || [];
    // if (!routes?.length) {
    //   return matchContext;
    // }
    // for (let i = 0; i < routes.length; i++) {
    //   const route = routes[i];
    //   const m = matchPath(pathname, route);
    //   if (!m) {
    //     continue;
    //   }
    //   const matchedRoute = { ...route };
    //   matchContext.push(matchedRoute);
    //   if (route.routes?.length) {
    //     matchedRoute.routes = this.getMatchedRoutes(
    //       pathname,
    //       route.routes,
    //       matchContext
    //     );
    //   }
    // }
    // return matchContext;
    let matched: T | undefined;
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      const m = matchPath(pathname, route);
      if (!m) {
        continue;
      }
      matched = route;
    }
    return matched;
  }

  public extendRoute(route: IReactRoute): T {
    return route as T;
  }

  protected mergeRouteExtendState(to: T, from: T): void {
    // by default, there is nothing to merge
  }

  public addRouteProvider(provider: ClassProvider): T[] | undefined {
    const routes = this.scanProvider(provider);
    if (!routes) {
      return;
    }
    const addedRoutes = [];
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const extRoute = this.extendRoute(route);
      this.addRoute(extRoute);
      addedRoutes.push(extRoute);
    }
    return addedRoutes;
  }

  public replaceRouteProvider(
    nextProvider: ClassProvider,
    preProviderId: string
  ): { added: T[]; removed: T[]; modified: T[] } {
    const nextRoutes = (this.scanProvider(nextProvider) || []).map((value) =>
      this.extendRoute(value)
    );
    const preProviders = this.filterRoutes(
      (route) => route.providerId === preProviderId
    );

    const added: T[] = [];
    const removed: T[] = [];
    const modified: T[] = [];

    preProviders.forEach((route) => {
      const next = nextRoutes.find((value) => value.path === route.path);
      // let next: T|undefined = undefined
      // for (let i = 0; i < nextRoutes.length; i++) {
      //   if (nextRoutes[i].path === route.path){
      //     next = nextRoutes[i]
      //     this.mergeRouteExtendState(next, route) // merge some extend props
      //     break
      //   }
      // }
      this.removeRoute(route.path as string);
      if (next) {
        this.mergeRouteExtendState(next, route);
        modified.push(next);
      } else {
        removed.push(route);
      }
    });
    nextRoutes.forEach((route) => {
      this.addRoute(this.extendRoute(route));
      const pre = preProviders.find((value) => value.path === route.path);
      if (!pre) {
        added.push(route);
      }
    });

    return { added, removed, modified };
  }

  protected scanProvider(provider: ClassProvider): IReactRoute[] | undefined {
    const { useClass, id } = provider;
    const routeMeta = getRouteMeta(useClass);
    if (!routeMeta) {
      return;
    }
    const routes: IReactRoute[] = [];
    if (Array.isArray(routeMeta.path)) {
      routeMeta.path?.forEach((path) => {
        const route: IReactRoute = {
          ...routeMeta,
          path: path,
          providerId: id,
        };
        routes.push(route);
      });
    } else if (typeof routeMeta.path === "string") {
      const route: IReactRoute = {
        path: routeMeta.path,
        providerId: id,
      };
      routes.push(route);
    }
    return routes;
  }
}
