import { IReactRoute, ReactApplicationConfiguration, ReactApplicationContext } from "@symph/react";
import { ComponentWrapper, EntryType, IApplicationContext } from "@symph/core";

export class JoyReactApplicationContext extends ReactApplicationContext {
  public scannedModules: Record<string, unknown>[];

  constructor(
    // protected readonly entry: EntryType | EntryType[],
    protected reactApplicationConfiguration: new (...args: any) => ReactApplicationConfiguration,
    // protected readonly appConfig: ApplicationConfig,
    // container?: ApplicationContainer,
    initState: Record<string, any> = {},
    public readonly parent?: IApplicationContext
  ) {
    super(reactApplicationConfiguration, initState, parent);
    this.scannedModules = [];
  }

  /**
   * 注册提前自动生成的模块
   * @param mod
   */
  public registerPreGenModule(mod: Record<string, unknown>) {
    const components = this.dependenciesScanner.scan(mod);
    if (components) {
      this.container.addProviders(components);
    }
  }

  protected async initContext(): Promise<void> {
    await super.initContext();
    const joyReactAutoGenRoutes = this.getSync("joyReactAutoGenRoutes") as IReactRoute[];

    const findRouteModule = (routes: IReactRoute[]) => {
      for (const route of routes) {
        if (route.componentModule) {
          this.scannedModules.push(route.componentModule);
        }
        if (route.children && route.children.length > 0) {
          findRouteModule(route.children);
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
