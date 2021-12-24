import { IReactRoute } from "../interfaces";
import { matchPath, PathMatch, PathPattern } from "react-router";
import { ClassComponent, isClassComponent, TComponent, ComponentName, Type } from "@symph/core";
import { getRouteMeta, IRouteMeta } from "./react-route.decorator";
import * as H from "history";
import { RoutePathNode } from "./route-sorter";
import React from "react";
import { ReactRouteLoader } from "./react-route-loader";
import { any, object } from "prop-types";
import { keys } from "object-hash";

export class ReactRouter<T extends IReactRoute = IReactRoute> {
  protected routesMap: Map<string, T> = new Map<string, T>(); // store all routes
  protected routeTrees: T[] = []; // routes as be formatted as tree

  private rootRouteNode = new RoutePathNode<T>();

  protected getRoutePathCacheKey({ path, index }: Pick<T, "index" | "path">): string {
    if (index) {
      return path + (path.endsWith("/") ? "" : "/") + "$$index";
    } else {
      return path;
    }
  }

  protected addRouteCache(route: T) {
    const cacheKey = this.getRoutePathCacheKey(route);
    this.routesMap.set(cacheKey, route);
  }

  protected getRouteCache(routePattern: Pick<T, "index" | "path">): T | undefined {
    const cacheKey = this.getRoutePathCacheKey(routePattern);
    return this.routesMap.get(cacheKey);
  }

  public getRoutes(): T[] {
    return this.routeTrees;
  }

  public setRoutes(routes: T[]): void {
    this.routesMap = new Map();
    this.traverseTree(routes, (r) => {
      this.addRouteCache(r);
      // this.routesMap.set(r.path, r);
      return false;
    });
    this.refreshTree();
  }

  private curLocation: H.Location;

  public get location(): H.Location {
    return this.curLocation;
  }

  public setCurrentLocation(location: H.Location) {
    this.curLocation = location;
  }

  public hasRouteByPath(route: T): T | undefined {
    return this.getRouteCache(route);
  }

  public addRoute(route: T) {
    const existRoute = this.getRouteCache(route);
    if (existRoute) {
      console.debug(
        `Overriding route {path:${existRoute.path}}, replacing {providerName: ${String(existRoute.componentName)} with {providerName: ${String(
          route.componentName
        )}`
      );
    }
    if (route.componentName && !route.element) {
      route.element = this.createRouteElement(route);
    }
    this.addRouteCache(route);
    // this.routesMap.set(route.path, route);
    this.rootRouteNode.insertRoute(route);
    this.routeTrees = this.rootRouteNode.smooth();
  }

  protected createRouteElement(route: T) {
    return React.createElement<any>(ReactRouteLoader, { route });
  }

  /**
   * 删除路由
   * @param routePath 匹配的路由路径，和注册的路由路径对比。
   * @param rmChildren 是否同时删除其子路由
   */
  public removeRoute(routePath: string, rmChildren = false): T[] | undefined {
    let removedRoutes = [] as T[];
    for (const route of this.routesMap.values()) {
      if (rmChildren) {
        if (route.path.startsWith(routePath)) {
          removedRoutes.push(route);
        }
      } else {
        if (route.path === routePath) {
          removedRoutes.push(route);
          break;
        }
      }
    }

    if (!removedRoutes?.length) {
      return undefined;
    }
    for (const route of removedRoutes) {
      const cacheKey = this.getRoutePathCacheKey(route);
      this.routesMap.delete(cacheKey);
    }
    // 重建整个routeTree, 可以优化为：只摘除PathNode中的节点，然后生成树。
    this.refreshTree();
    return removedRoutes;
  }

  protected refreshTree(): void {
    this.rootRouteNode = new RoutePathNode<T>();
    this.rootRouteNode.insertRoutes(Array.from(this.routesMap.values()));
    this.routeTrees = this.rootRouteNode.smooth();
  }

  public filterRoutes(predicate: (route: T) => boolean): T[] {
    return this._filterRoute(this.routeTrees, predicate);
  }

  private _filterRoute(routes: T[], predicate: (route: T) => boolean, previousValue: T[] = []): T[] {
    for (const route of routes) {
      if (predicate(route)) {
        previousValue.push(route);
        if (route.children) {
          this._filterRoute(route.children as T[], predicate, previousValue);
        }
      }
    }
    return previousValue;
  }

  private find(routes: T[], predicate: (route: T) => boolean, previousValue: T[] = []): T[] {
    for (const route of routes) {
      if (predicate(route)) {
        previousValue.push(route);
        if (route.children) {
          this.find(route.children as T[], predicate, previousValue);
        }
        break;
      }
    }
    return previousValue;
  }

  public traverse(visitor: (route: T) => boolean | undefined): void {
    this.traverseTree(this.routeTrees, visitor);
  }

  protected traverseTree(routes: T[], visitor: (route: T) => boolean | undefined): boolean | undefined {
    for (const route of routes) {
      if (visitor(route)) {
        return true;
      }
      if (route.children) {
        if (this.traverseTree(route.children as T[], visitor)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 返回数组，前一个路由是后一个路由的父路由。
   * @param pathname
   */
  public getMatchedRoutes(pathname: string): T[] | undefined {
    const rst = this.find(this.getRoutes(), (route) => {
      let matched: PathMatch | null = matchPath({ path: route.path, end: !route.children?.length }, pathname);
      // if (route.path.endsWith("/index")) {
      //   const indexPath = route.path.slice(0, -6);
      //   matched = matchPath(indexPath, pathname);
      // }
      // if (!matched) {
      //   matched = matchPath(route.path, pathname);
      // }
      return !!matched;
    });
    return rst;
  }

  protected mergeRouteExtendState(to: T, from: T): void {
    // by default, there is nothing to merge
  }

  public addRouteProvider(provider: TComponent, basePath?: string): T[] | undefined {
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

  public replaceRouteProvider(nextProvider: ClassComponent, preProviderName: string): { added: T[]; removed: T[]; modified: T[] } {
    const nextRoutes = this.scanProvider(nextProvider) || [];
    const preProviders = this.filterRoutes((route) => route.componentName === preProviderName);

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

  protected createFromMeta(
    path: string,
    providerName: ComponentName,
    providerPackage: string | undefined,
    meta: IRouteMeta,
    useClass: Type | Function
  ): T {
    const hasStaticState = !!useClass.prototype.initialModelStaticState;
    const hasState = !!useClass.prototype.initialModelState;
    return {
      ...meta,
      path,
      componentName: providerName,
      componentPackage: providerPackage,
      hasStaticState,
      hasState,
    } as T;
  }

  public scanProvider(provider: TComponent): T[] | undefined {
    const { name, package: providerPackage } = provider;
    let clazz: Type | Function;
    if (isClassComponent(provider)) {
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
