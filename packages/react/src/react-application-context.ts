import { ApplicationConfig } from "./application-config";
import { renderComponent } from "./react-app-container";
import { DOMElement, ReactElement } from "react";
import reactDom from "react-dom";
import { ReactReduxService } from "./redux/react-redux.service";
import { IReactRoute } from "./interfaces/react-route.interface";
import { ComponentWrapper, CoreContainer, CoreContext, EntryType, Logger } from "@symph/core";
import { IReactApplication } from "./interfaces";
import { TReactAppComponent } from "./react-app-component";
import { MountModule } from "./mount/mount-module";
import { MountService } from "./mount/mount.service";
import { ReactApplicationConfig } from "./react-application-config";
import { ReactRouter } from "./router/react-router";

/**
 * @publicApi
 */
export class ReactApplicationContext extends CoreContext implements IReactApplication {
  private readonly logger = new Logger(ReactApplicationContext.name, true);
  protected readonly reduxStore: ReactReduxService;
  protected routes: IReactRoute[];
  public mountService: MountService;
  public router: ReactRouter;

  constructor(
    // protected readonly entry: EntryType| EntryType[],
    protected reactApplicationConfig: typeof ReactApplicationConfig,
    protected readonly appConfig: ApplicationConfig,
    container?: CoreContainer,
    initState: Record<string, any> = {}
  ) {
    super([], container);
    this.reduxStore = new ReactReduxService(this.appConfig, initState);
  }

  protected async initContext(): Promise<void> {
    await super.initContext();
    const coreComps = [
      {
        name: "applicationConfig",
        type: ApplicationConfig,
        useValue: this.appConfig,
      },
      {
        name: "reduxStore",
        type: ReactReduxService,
        useValue: this.reduxStore,
      },
      ...this.dependenciesScanner.scan(this.reactApplicationConfig),
    ];
    const coreWrappers = this.container.addProviders(coreComps);
    await this.createInstancesOfDependencies(coreWrappers);

    this.router = this.syncGet(ReactRouter);
    this.mountService = this.syncGet(MountService);
  }

  public async init(): Promise<this> {
    await super.init();
    this.router = this.syncGet(ReactRouter);

    await this.registerMiddleware();
    // await this.registerRouter();
    // await this.callInitHook()
    // await this.registerRouterHooks();
    // await this.callBootstrapHook()

    this.logger.log("Joy application successfully started");
    return this;
  }

  public registerModule(module: EntryType | EntryType[]): ComponentWrapper[] {
    const modules = Array.isArray(module) ? module : [module];
    let wrappers = [] as ComponentWrapper[];
    for (const md of modules) {
      let compWrappers: ComponentWrapper[];
      let mount = "";
      if (md instanceof MountModule) {
        mount = md.mount;
        compWrappers = super.registerModule(md.module);
        if (compWrappers && compWrappers.length > 0) {
          this.mountService.setMount(mount, compWrappers);
        }
      } else {
        compWrappers = super.registerModule(md);
      }
      if (!compWrappers || compWrappers.length === 0) {
        continue;
      }
      this.registerModuleRouter(md, compWrappers);
      compWrappers = compWrappers.concat(compWrappers);
    }

    return wrappers;
  }

  protected registerModuleRouter(md: EntryType, compWrappers: ComponentWrapper[]): IReactRoute[] | undefined {
    let mount = "";
    if (md instanceof MountModule) {
      mount = md.mount;
    }
    let addedRoutes: IReactRoute[] | undefined;
    compWrappers.forEach((wrapper) => {
      const routes = this.router.addRouteProvider(wrapper, mount);
      if (routes && routes.length > 0) {
        if (!addedRoutes) {
          addedRoutes = routes;
        } else {
          addedRoutes.push(...routes);
        }
      }
    });
    return addedRoutes;
  }

  public async registerMiddleware() {
    // no-op
  }

  public setGlobalPrefix(prefix: string): this {
    this.appConfig.setGlobalPrefix(prefix);
    return this;
  }

  dispatch(action: any): Promise<unknown> | null | undefined {
    return this.reduxStore.store.dispatch(action);
  }

  getState(): unknown {
    return this.reduxStore.store.getState();
  }

  start(rootComponent?: TReactAppComponent): ReactElement;
  start(rootComponent: TReactAppComponent, domContainer?: DOMElement<any, any> | string): ReactElement {
    // return createApplicationComponent(this);
    const appContent = renderComponent({
      appContext: this,
      Component: rootComponent,
    });

    if (domContainer) {
      if (window === undefined) {
        throw new Error("只能在浏览器上渲染应用dom");
      }
      // todo 完成在浏览器上渲染
      // @ts-ignore
      reactDom.render(appContent, domContainer);
    }
    return appContent;
  }
}
