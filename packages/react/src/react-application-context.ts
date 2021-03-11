import { ApplicationConfig } from "./application-config";
import { renderComponent } from "./application-component";
import React, { DOMElement, ReactElement } from "react";
import reactDom from "react-dom";
import { ReduxStore } from "./redux/redux-store";
import { IReactRoute } from "./interfaces/react-route.interface";
import { EntryType, JoyContainer, Logger, CoreContext } from "@symph/core";
import { IReactApplication } from "./interfaces";

/**
 * @publicApi
 */
export class ReactApplicationContext extends CoreContext
  implements IReactApplication {
  private readonly logger = new Logger(ReactApplicationContext.name, true);
  protected readonly reduxStore: ReduxStore;
  protected routes: IReactRoute[];

  constructor(
    protected readonly entry: EntryType,
    protected readonly appConfig: ApplicationConfig,
    container?: JoyContainer
  ) {
    super(entry, container);
    this.reduxStore = new ReduxStore(this.appConfig);

    this.registerInternalModules({
      applicationConfig: {
        id: "applicationConfig",
        type: ApplicationConfig,
        useValue: this.appConfig,
      },
      reduxStore: {
        id: "reduxStore",
        type: ReduxStore,
        useValue: this.reduxStore,
      },
    });
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

  start(
    rootComponent?: React.ComponentType<{ [key: string]: unknown }>
  ): ReactElement;
  start(
    rootComponent: React.ComponentType<{
      routes?: IReactRoute[];
      [key: string]: unknown;
    }>,
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
