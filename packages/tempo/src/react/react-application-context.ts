import { EntryType, IReactApplication } from "../interfaces";
import { Logger } from "../services/logger.service";
import { ApplicationConfig } from "./application-config";
import { MESSAGES } from "../constants";
import { JoyContainer } from "../injector/joy-container";
import { TempoContext } from "../tempo-context";
import createApplicationComponent from "./application-component";
import { ComponentType } from "react";
import { ReduxStore } from "./redux/redux-store";

/**
 * @publicApi
 */
export class ReactApplicationContext extends TempoContext
  implements IReactApplication {
  private readonly logger = new Logger(ReactApplicationContext.name, true);
  protected readonly container: JoyContainer;
  protected readonly reduxStore: ReduxStore;

  constructor(
    protected readonly entry: EntryType,
    protected readonly appConfig: ApplicationConfig,
    container?: JoyContainer
  ) {
    super(entry, container);
    this.reduxStore = new ReduxStore(this.appConfig);
  }

  public async loadModule(module: EntryType): Promise<void> {
    this.createTempoModule();
    await super.loadModule(module);
  }

  protected createTempoModule(): void {
    [
      {
        id: "applicationConfig",
        type: ApplicationConfig,
        useValue: this.appConfig,
      },
      {
        id: "reduxStore",
        type: ReduxStore,
        useValue: this.reduxStore,
      },
    ].forEach((provider) => {
      this.container.addProvider(provider);
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
    this.logger.log(MESSAGES.APPLICATION_READY);
    return this;
  }

  // public  isInitialized() {
  //   return this.isInitialized
  // }

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

  start(): ComponentType {
    return createApplicationComponent(this);
  }
}
