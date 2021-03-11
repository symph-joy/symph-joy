import {
  ClassProvider,
  EntryType,
  IJoyContext,
  Scope,
  Type,
  TypeOrTokenType,
} from "./interfaces";
import { Logger, LoggerService } from "./services";
import { isFunction, isNil } from "./utils/shared.utils";
import { UnknownElementException } from "./errors/exceptions/unknown-element.exception";
import { JoyContainer } from "./injector/joy-container";
import { Injector } from "./injector/injector";
import { STATIC_CONTEXT } from "./injector/constants";
import { InstanceLoader } from "./injector/instance-loader";
import { RuntimeException } from "./errors/exceptions/runtime.exception";
import { ThenableResult } from "./utils/task-thenable";
import { Dependency } from "./interfaces/dependency.interface";
import { ProviderScanner } from "./provider-scanner";
import { Simulate } from "react-dom/test-utils";
import { providerNameGenerate } from "./injector/provider-name-generator";

/**
 * @publicApi
 */
export class TempoContext implements IJoyContext {
  protected isInitialized = false;

  private instanceLoader: InstanceLoader;
  private dependenciesScanner: ProviderScanner;
  protected readonly injector = new Injector();

  public hasInitialized(): boolean {
    return this.isInitialized;
  }

  constructor(
    protected readonly entry: EntryType,
    protected readonly container: JoyContainer = new JoyContainer()
  ) {
    this.dependenciesScanner = new ProviderScanner(container);
    this.instanceLoader = new InstanceLoader(container, this.injector);
  }

  protected async loadModule(module: EntryType): Promise<void> {
    this.dependenciesScanner.scan(module);
    await this.instanceLoader.createInstancesOfDependencies();
  }

  public get<TInput = any, TResult = TInput>(
    typeOrToken: TypeOrTokenType<unknown>,
    options: { optional?: boolean } = { optional: false }
  ): Promise<TResult> | TResult {
    const providerId = this.getProviderId(typeOrToken);

    const instanceWrapper = this.container.getProvider(typeOrToken);
    if (isNil(instanceWrapper)) {
      if (options.optional) {
        return null;
      }
      throw new UnknownElementException(providerId);
    }

    const provider = this.injector.loadProvider(
      instanceWrapper,
      this.container
    );
    return provider as Promise<TResult> | TResult;
  }

  public syncGetProvider<TInput = any, TResult = TInput>(
    typeOrToken: TypeOrTokenType<unknown>,
    options = { strict: false, optional: false }
  ): TResult {
    const loadRst = this.get<TInput, TResult>(typeOrToken, options);
    if (loadRst instanceof Promise) {
      throw new RuntimeException("Its an async provider, can not load as sync");
    }
    return loadRst;
  }

  /**
   * inject properties for instance
   */
  public resolveProperties<TInstance>(
    instance: TInstance,
    typeOfInstance?: Type<any>
  ): ThenableResult<Dependency[]> {
    const providerId: string = this.getProviderId(typeOfInstance);
    let instanceWrapper = this.container.getProvider(providerId);
    if (isNil(instanceWrapper)) {
      // 生成一个临时的wrapper，用于缓存注入信息
      const provider: ClassProvider = {
        id: providerId,
        type: typeOfInstance,
        useClass: typeOfInstance,
        scope: Scope.DEFAULT,
      };
      instanceWrapper = this.container.addProvider(provider);
    }
    const injectedProps = this.injector
      .loadInstanceProperties(
        instance,
        instanceWrapper,
        this.container,
        STATIC_CONTEXT
      )
      .getResult();

    return injectedProps;
  }

  /**
   * Initalizes the Temp application.
   * Calls the Joy lifecycle events.
   *
   * @returns {Promise<this>} The JoyApplicationContext instance as Promise
   */
  public async init(): Promise<this> {
    if (this.isInitialized) {
      return this;
    }
    await this.loadModule(this.entry);
    this.isInitialized = true;
    return this;
  }

  protected async dispose(): Promise<void> {
    // tempo application context has no application
    // to dispose, therefore just call a noop
    return Promise.resolve();
  }

  public async close(): Promise<void> {
    await this.dispose();
  }

  public useLogger(logger: LoggerService) {
    Logger.overrideLogger(logger);
  }

  private getProviderId(typeOrToken: TypeOrTokenType<unknown>): string {
    return isFunction(typeOrToken)
      ? providerNameGenerate(typeOrToken)
      : (typeOrToken as string);
  }
}
