import { ApplicationConfig } from "./application-config";
import { renderComponent } from "./react-app-container";
import React, { DOMElement, ReactElement } from "react";
import reactDom from "react-dom";
import { ReactReduxService } from "./redux/react-redux.service";
import { IReactRoute } from "./interfaces/react-route.interface";
import { EntryType, JoyContainer, Logger, CoreContext } from "@symph/core";
import { IReactApplication } from "./interfaces";
import { TReactAppComponent } from "./react-app-component";

/**
 * @publicApi
 */
export class ReactApplicationContext extends CoreContext
  implements IReactApplication {
  private readonly logger = new Logger(ReactApplicationContext.name, true);
  protected readonly reduxStore: ReactReduxService;
  protected routes: IReactRoute[];

  constructor(
    protected readonly entry: EntryType,
    protected readonly appConfig: ApplicationConfig,
    container?: JoyContainer,
    initState: Record<string, any> = {}
  ) {
    super(entry, container);
    this.reduxStore = new ReactReduxService(this.appConfig, initState);
  }

  protected async initInternalProvider(): Promise<string[]> {
    const superIds = await super.initInternalProvider();
    const myIds = await this.loadModule({
      applicationConfig: {
        id: "applicationConfig",
        type: ApplicationConfig,
        useValue: this.appConfig,
      },
      reduxStore: {
        id: "reduxStore",
        type: ReactReduxService,
        useValue: this.reduxStore,
      },
    });
    return [...superIds, ...myIds];
  }

  public async init(): Promise<this> {
    await super.init();
    await this.registerMiddleware();
    // await this.registerRouter();
    // await this.callInitHook()
    // await this.registerRouterHooks();
    // await this.callBootstrapHook()

    this.isInitialized = true;
    this.logger.log("Joy application successfully started");
    return this;
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
  start(
    rootComponent: TReactAppComponent,
    domContainer?: DOMElement<any, any> | string
  ): ReactElement {
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
