import { IReactRoute, ReactApplicationConfiguration, ReactApplicationContext } from "@symph/react";
import { ComponentWrapper, EntryType, IApplicationContext } from "@symph/core";

export class JoyReactApplicationContext extends ReactApplicationContext {
  public scannedModules: Record<string, unknown>[];

  constructor(
    // protected readonly entry: EntryType | EntryType[],
    protected reactApplicationConfiguration: typeof ReactApplicationConfiguration,
    // protected readonly appConfig: ApplicationConfig,
    // container?: ApplicationContainer,
    initState: Record<string, any> = {},
    public readonly parent?: IApplicationContext
  ) {
    super(reactApplicationConfiguration, initState, parent);
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

  protected registerModuleRouter(mount: string, md: EntryType, compWrappers: ComponentWrapper[]): IReactRoute[] | undefined {
    if (this.scannedModules.includes(md as Record<string, any>)) {
      // 如果没有在打包的时候预先扫描过模块，则在运行时重新扫描和加载路由组件。
      return undefined;
    }
    return super.registerModuleRouter(mount, md, compWrappers);
  }
}
