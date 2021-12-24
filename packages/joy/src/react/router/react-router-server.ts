import { Inject, Component, RuntimeException } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";

@Component()
export class ReactRouterServer extends ReactRouter {
  protected scannedModules = [] as Record<string, unknown>[];

  constructor(
    @Inject("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[]
  ) {
    super();
    const routeTrees = joyReactAutoGenRoutes;

    this.traverseTree(routeTrees, (route) => {
      if (route.componentModule) {
        this.scannedModules.push(route.componentModule);
      }
      this.addRouteCache(route);
      if (route.componentName && !route.element) {
        route.element = this.createRouteElement(route);
      }
      return false;
    });
    this.routeTrees = routeTrees;
  }

  public hasModuleScanned(mod: Record<string, unknown>): boolean {
    return this.scannedModules.includes(mod);
  }
}
