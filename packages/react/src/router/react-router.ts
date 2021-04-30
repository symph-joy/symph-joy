import { IReactRoute } from "../interfaces";
import { matchPath } from "react-router";
import { ClassProvider, Type } from "@symph/core";
import { getRouteMeta, IRouteMeta } from "./react-route.decorator";
import * as H from "history";

export class ReactRouter<T extends IReactRoute = IReactRoute> {
  protected routes: T[] = [];

  public getRoutes(): T[] {
    return this.routes;
  }

  public setRoutes(routes: T[]): void {
    this.routes = routes;
  }

  private curLocation: H.Location;

  public get location(): H.Location {
    return this.curLocation;
  }

  public setCurrentLocation(location: H.Location) {
    this.curLocation = location;
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

  public getParentRoutes(routePath: string): T[] | undefined {
    let parents: T[] | undefined = undefined;
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (route.path.startsWith(routePath) && route.path !== routePath) {
        if (!parents) {
          parents = [];
        }
        parents.push(route);
      }
    }
    return parents;
  }

  public getMatchedRoutes(pathname: string): T[] | undefined {
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
    let matched: T[] | undefined = undefined;
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      const m = matchPath(pathname, route);
      if (!m) {
        continue;
      }
      if (!matched) {
        matched = [];
      }
      matched.push(route);
    }
    return matched;
  }

  // protected extendRoute(route: IReactRoute): T {
  //   return route as T;
  // }

  protected mergeRouteExtendState(to: T, from: T): void {
    // by default, there is nothing to merge
  }

  public addRouteProvider(provider: ClassProvider): T[] | undefined {
    const routes = this.scanProvider(provider);
    if (!routes || routes.length === 0) {
      return;
    }
    const addedRoutes = [];
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      // const extRoute = this.extendRoute(route);
      this.addRoute(route);
      addedRoutes.push(route);
    }
    return addedRoutes;
  }

  public replaceRouteProvider(
    nextProvider: ClassProvider,
    preProviderId: string
  ): { added: T[]; removed: T[]; modified: T[] } {
    const nextRoutes = this.scanProvider(nextProvider) || [];
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
      this.addRoute(route);
      const pre = preProviders.find((value) => value.path === route.path);
      if (!pre) {
        added.push(route);
      }
    });

    return { added, removed, modified };
  }

  protected fromRouteMeta(
    path: string,
    providerId: string,
    meta: IRouteMeta,
    useClass: Type
  ): T {
    const hasStaticState = !!useClass.prototype.initialModelStaticState;
    const hasState = !!useClass.prototype.initialModelState;
    return {
      ...meta,
      path,
      providerId,
      hasStaticState,
      hasState,
    } as T;
  }

  protected scanProvider(provider: ClassProvider): T[] | undefined {
    const { useClass, id } = provider;
    const routeMeta = getRouteMeta(useClass);
    if (!routeMeta) {
      return;
    }
    const routes: T[] = [];
    if (Array.isArray(routeMeta.path)) {
      routeMeta.path?.forEach((path) => {
        const route = this.fromRouteMeta(path, id, routeMeta, useClass);
        routes.push(route);
      });
    } else {
      const route = this.fromRouteMeta(routeMeta.path, id, routeMeta, useClass);
      routes.push(route);
    }
    return routes;
  }
}
