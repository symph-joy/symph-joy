import { Autowire, Component, RuntimeException } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";

@Component()
export class ReactRouterServer extends ReactRouter {
  protected scannedModules = [] as Record<string, unknown>[];

  constructor(
    @Autowire("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[]
  ) {
    super();
    const routeTrees = joyReactAutoGenRoutes.map((it: any) => {
      return {
        ...it,
        component: it.component?.default,
      };
    });

    this.traverseTree(routeTrees, (route) => {
      this.routesMap.set(route.path, route);
      if (route.providerModule) {
        this.scannedModules.push(route.providerModule);
      }
      return false;
    });
    this.routeTrees = routeTrees;
  }

  public hasModuleScanned(mod: Record<string, unknown>): boolean {
    return this.scannedModules.includes(mod);
  }
}
