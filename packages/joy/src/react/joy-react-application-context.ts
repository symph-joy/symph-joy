import { ApplicationConfig, IReactRoute, ReactApplicationConfig, ReactApplicationContext } from "@symph/react";
import { ComponentWrapper, CoreContainer, EntryType } from "@symph/core";

export class JoyReactApplicationContext extends ReactApplicationContext {
  public scannedModules: Record<string, unknown>[];

  constructor(protected reactApplicationConfig: typeof ReactApplicationConfig, protected readonly appConfig: ApplicationConfig, container?: CoreContainer, initState: Record<string, any> = {}) {
    super(reactApplicationConfig, appConfig, container, initState);
  }

  protected async initContext(): Promise<void> {
    await super.initContext();
    const joyReactAutoGenRoutes = this.syncGet("joyReactAutoGenRoutes") as IReactRoute[];
    this.scannedModules = [];
    const findRouteModule = (routes: IReactRoute[]) => {
      for (const route of routes) {
        if (route.providerModule) {
          this.scannedModules.push(route.providerModule);
        }
        if (route.routes && route.routes.length > 0) {
          findRouteModule(route.routes);
        }
      }
    };
    findRouteModule(joyReactAutoGenRoutes);
  }

  protected registerModuleRouter(md: EntryType, compWrappers: ComponentWrapper[]): IReactRoute[] | undefined {
    if (this.scannedModules.includes(md as Record<string, any>)) {
      // 如果没有在打包的时候扫描过路由，则运行时扫描和识别路由组件。
      return undefined;
    }
    return super.registerModuleRouter(md, compWrappers);
  }
}