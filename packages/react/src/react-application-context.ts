import { ReactApplicationConfig } from "./react-application-config";
import { renderComponent } from "./react-app-container";
import React, { DOMElement, ReactElement } from "react";
import reactDom from "react-dom";
import { ReactReduxService } from "./redux/react-redux.service";
import { IReactRoute } from "./interfaces/react-route.interface";
import { ComponentWrapper, ApplicationContext, EntryType, FactoryComponent, IApplicationContext, Logger, TComponent } from "@symph/core";
import { IReactApplication } from "./interfaces";
import { TReactAppComponent } from "./react-app-component";
import { MountModule } from "./mount/mount-module";
import { MountService } from "./mount/mount.service";
import { ReactApplicationConfiguration } from "./react-application.configuration";
import { ReactRouterService } from "./router/react-router-service";

type ReactAPPEntryType = EntryType | TComponent | MountModule | (EntryType | MountModule | TComponent)[];

/**
 * @publicApi
 */
export class ReactApplicationContext extends ApplicationContext implements IReactApplication {
  private readonly logger = new Logger(ReactApplicationContext.name, true);
  protected reduxStore: ReactReduxService;
  protected routes: IReactRoute[];
  public mountService: MountService;
  public reactRouterService: ReactRouterService;
  public reactApplicationConfig: ReactApplicationConfig;

  constructor(
    protected reactApplicationConfiguration: typeof ReactApplicationConfiguration,
    protected initState: Record<string, any> = {},
    public readonly parent?: IApplicationContext
  ) {
    super(undefined, parent);
    // this.reduxStore = new ReactReduxService(this.appConfig, initState);
  }

  protected async initContext(): Promise<void> {
    const initState = this.initState;
    await super.initContext();
    const coreComps = [
      // {
      //   name: "applicationConfig",
      //   type: ReactApplicationConfig,
      //   useValue: this.appConfig,
      // },
      {
        name: "reduxStore",
        type: ReactReduxService,
        // useValue: this.reduxStore,
        useFactory: function (applicationConfig: ReactApplicationConfig) {
          return new ReactReduxService(applicationConfig, initState);
        },
        inject: [ReactApplicationConfig],
      } as FactoryComponent,
      ...this.dependenciesScanner.scan(this.reactApplicationConfiguration),
    ];
    const coreWrappers = this.container.addProviders(coreComps);
    await this.createInstancesOfDependencies(coreWrappers);

    this.reduxStore = this.getSync(ReactReduxService);
    this.reactApplicationConfig = this.getSync(ReactApplicationConfig);
    this.reactRouterService = this.getSync(ReactRouterService);
    this.mountService = this.getSync(MountService);
  }

  public async init(): Promise<this> {
    await super.init();
    this.reactRouterService = this.getSync(ReactRouterService);

    await this.registerMiddleware();
    // await this.registerRouter();
    // await this.callInitHook()
    // await this.registerRouterHooks();
    // await this.callBootstrapHook()

    this.logger.log("Joy application successfully started");
    return this;
  }

  public registerModule(module: ReactAPPEntryType): ComponentWrapper[] {
    const modules = Array.isArray(module) ? module : [module];
    let wrappers = [] as ComponentWrapper[];
    for (const md of modules) {
      let compWrappers: ComponentWrapper[];
      let mount = "";
      let module: EntryType | TComponent;
      if ((md as MountModule).mount) {
        mount = (md as MountModule).mount;
        module = (md as MountModule).module;
        compWrappers = super.registerModule(module);
        if (compWrappers && compWrappers.length > 0) {
          this.mountService.setMount(mount, compWrappers);
        }
      } else {
        module = md as EntryType | TComponent;
        compWrappers = super.registerModule(module);
      }
      if (!compWrappers || compWrappers.length === 0) {
        continue;
      }
      this.registerModuleRouter(mount, md, compWrappers);
      wrappers = wrappers.concat(compWrappers);
    }

    return wrappers;
  }

  protected registerModuleRouter(
    mount: string,
    md: EntryType | TComponent | MountModule,
    compWrappers: ComponentWrapper[]
  ): IReactRoute[] | undefined {
    let addedRoutes: IReactRoute[] | undefined;
    compWrappers.forEach((wrapper) => {
      const routes = this.reactRouterService.addRouteProvider(wrapper, mount);
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
    this.reactApplicationConfig.setGlobalPrefix(prefix);
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
      children: rootComponent ? React.createElement(rootComponent, { appContext: this }) : undefined,
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
