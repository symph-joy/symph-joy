import { Inject, Component, RuntimeException } from "@symph/core";
import { IReactRoute, ReactRouterService } from "@symph/react";

@Component()
export class ReactRouterServer extends ReactRouterService {
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
      // 需优化： 每次渲染不应该修改原路由信息，保证joyReactAutoGenRoutes 原数据任何时候状态一致。
      route.element = this.createElementWrapper(route);
      return false;
    });

    this.refreshTree();
  }

  public hasModuleScanned(mod: Record<string, unknown>): boolean {
    return this.scannedModules.includes(mod);
  }
}
