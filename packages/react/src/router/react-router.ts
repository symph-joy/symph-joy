import { IReactRoute } from "../interfaces";
import { matchPath } from "react-router";
import { ClassProvider, isClassProvider, Provider, TProviderName, Type } from "@symph/core";
import { getRouteMeta, IRouteMeta } from "./react-route.decorator";
import * as H from "history";
import { RoutePathNode } from "./route-sorter";

export class ReactRouter<T extends IReactRoute = IReactRoute> {
  protected routes: T[] = [];

  private rootRouteNode = new RoutePathNode<T>();

  public getRoutes(): T[] {
    return this.routes;
  }

  public setRoutes(routes: T[]): void {
    this.routes = routes;
    this.rootRouteNode = new RoutePathNode<T>();
    if (routes && routes.length) {
      this.rootRouteNode.insertRoutes(routes);
    }
  }

  private curLocation: H.Location;

  public get location(): H.Location {
    return this.curLocation;
  }

  public setCurrentLocation(location: H.Location) {
    this.curLocation = location;
  }

  public getPageRoutes(): T[] {
    return this.routes;
  }

  public hasRouteByPath(path: string): T | undefined {
    return this.routes.find((v) => v.path === path);
  }

  public addRoute(route: T) {
    const existRoute = this.hasRouteByPath(route.path);
    if (existRoute) {
      console.debug(`Overriding route {path:${existRoute.path}}, replacing {providerName: ${String(existRoute.providerName)} with {providerName: ${String(route.providerName)}`);
    }
    this.rootRouteNode.insertRoute(route);
    this.routes = this.rootRouteNode.smooth();
    // this.routes.push(route);
  }

  public filterRoutes(predicate: (route: T) => boolean): T[] {
    return this._filterRoute(this.routes, predicate);
  }

  private _filterRoute(routes: T[], predicate: (route: T) => boolean, previousValue: T[] = []): T[] {
    for (const route of routes) {
      if (predicate(route)) {
        previousValue.push(route);
        if (route.routes) {
          this._filterRoute(route.routes as T[], predicate, previousValue);
        }
      }
    }
    return previousValue;
  }

  private find(routes: T[], predicate: (route: T) => boolean, previousValue: T[] = []): T[] {
    for (const route of routes) {
      if (predicate(route)) {
        previousValue.push(route);
        if (route.routes) {
          this.find(route.routes as T[], predicate, previousValue);
        }
        break;
      }
    }
    return previousValue;
  }

  public traverse(visitor: (route: T) => boolean): void {
    this._traverse(this.routes, visitor);
  }

  private _traverse(routes: T[], visitor: (route: T) => boolean): boolean {
    for (const route of routes) {
      if (visitor(route)) {
        return true;
      }
      if (route.routes) {
        if (this._traverse(route.routes as T[], visitor)) {
          return true;
        }
      }
      return false;
    }
    return false;
  }

  // todo 未实现递归移除，以及从排序树上移除。
  public removeRoute(routePath: string): T | undefined {
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (route.path === routePath) {
        this.routes.splice(i, 1);
        return route;
      }
    }
  }

  /**
   * 返回数组，前一个路由是后一个路由的父路由。
   * @param pathname
   */
  public getMatchedRoutes(pathname: string): T[] | undefined {
    const rst = this.find(this.getRoutes(), (route) => {
      let matchProps = route;
      if (route.path.endsWith("/index")) {
        matchProps = { ...route, path: [route.path, route.path.slice(0, -6)] };
      }
      const matched = matchPath(pathname, matchProps);

      return !!matched;
    });
    return rst;
  }

  protected mergeRouteExtendState(to: T, from: T): void {
    // by default, there is nothing to merge
  }

  public addRouteProvider(provider: Provider, basePath?: string): T[] | undefined {
    if (!provider.type || provider.type === Object) {
      return;
    }

    const routes = this.scanProvider(provider);
    if (!routes || routes.length === 0) {
      return;
    }
    const addedRoutes = [];
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      let path = route.path;
      if (basePath) {
        path = basePath + path;
      }
      if (path.endsWith("/") && path !== "/") {
        path = path.slice(0, -1);
      }
      route.path = path;
      this.addRoute(route);
      addedRoutes.push(route);
    }
    return addedRoutes;
  }

  public replaceRouteProvider(nextProvider: ClassProvider, preProviderName: string): { added: T[]; removed: T[]; modified: T[] } {
    const nextRoutes = this.scanProvider(nextProvider) || [];
    const preProviders = this.filterRoutes((route) => route.providerName === preProviderName);

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

  protected createFromMeta(path: string, providerName: TProviderName, providerPackage: string | undefined, meta: IRouteMeta, useClass: Type | Function): T {
    const hasStaticState = !!useClass.prototype.initialModelStaticState;
    const hasState = !!useClass.prototype.initialModelState;
    return {
      ...meta,
      path,
      providerName,
      providerPackage,
      hasStaticState,
      hasState,
    } as T;
  }

  public scanProvider(provider: Provider): T[] | undefined {
    const { name, package: providerPackage } = provider;
    let clazz: Type | Function;
    if (isClassProvider(provider)) {
      clazz = provider.useClass;
    } else {
      clazz = provider.type;
    }
    const routeMeta = getRouteMeta(clazz);
    if (!routeMeta) {
      return;
    }
    if (Array.isArray(name)) {
      throw new Error("ReactController component name must not be an array");
    }
    const routes: T[] = [];
    if (Array.isArray(routeMeta.path)) {
      routeMeta.path?.forEach((path) => {
        const route = this.createFromMeta(path, name, providerPackage, routeMeta, clazz);
        routes.push(route);
      });
    } else {
      const route = this.createFromMeta(routeMeta.path, name, providerPackage, routeMeta, clazz);
      routes.push(route);
    }
    return routes;
  }

  // public normalizeRoutePath(path: string): string {
  //   // If the path is `/` we need to append `/index`, otherwise the returned directory root will be bundles instead of pages
  //   if (path === "/") {
  //     path = "/index";
  //   } else if (/^\/index(\/|$)/.test(path)) {
  //     path = `/index${path}`;
  //   }
  //   // Resolve on anything that doesn't start with `/`
  //   if (!path.startsWith("/")) {
  //     path = `/${path}`;
  //   }
  //   // Throw when using ../ etc in the pathname
  //   const resolvedPage = posix.normalize(path);
  //   if (path !== resolvedPage) {
  //     throw new Error(
  //       `Requested and resolved page mismatch: ${path} ${resolvedPage}`
  //     );
  //   }
  //   return path;
  // }
}
