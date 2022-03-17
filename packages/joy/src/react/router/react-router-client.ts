import { Component, Inject } from "@symph/core";
import { IReactRoute, ReactRouterService } from "@symph/react";
import { normalizePathTrailingSlash } from "../../client/normalize-trailing-slash";

const basePath = (process.env.__JOY_ROUTER_BASEPATH as string) || "";

@Component()
export class ReactRouterClient extends ReactRouterService {
  constructor(
    @Inject("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[]
  ) {
    super();
    const routeTrees = joyReactAutoGenRoutes;
    this.traverseTree(routeTrees, (route) => {
      this.addRouteCache(route);
      // if (route.componentName && !route.element) {
      route.element = this.createElementWrapper(route);
      // }
      return false;
    });
    this.refreshTree();
  }

  // protected createRouteElement(route: IReactRoute): React.FunctionComponentElement<any> {
  //   return React.createElement<any>(JoyReactRouteLoader, { route });
  // }

  public addBasePath(path: string): string {
    // we only add the basepath on relative urls
    return basePath && path.startsWith("/") ? (path === "/" ? normalizePathTrailingSlash(basePath) : basePath + path) : path;
  }

  public delBasePath(path: string): string {
    return path.slice(basePath.length) || "/";
  }
}
