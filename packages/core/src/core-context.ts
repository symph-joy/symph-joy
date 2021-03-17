import {
  ClassProvider,
  EntryType,
  IJoyContext,
  Scope,
  Type,
  TypeOrTokenType,
} from "./interfaces";
import { Logger, LoggerService } from "./services/logger.service";
import { isFunction, isNil } from "./utils/shared.utils";
import { UnknownElementException } from "./errors/exceptions/unknown-element.exception";
import { JoyContainer } from "./injector/joy-container";
import { Injector } from "./injector/injector";
import { STATIC_CONTEXT } from "./injector/constants";
import { InstanceLoader } from "./injector/instance-loader";
import { RuntimeException } from "./errors/exceptions/runtime.exception";
import { ThenableResult } from "./utils/task-thenable";
import { IInjectableDependency } from "./interfaces/injectable-dependency.interface";
import { ProviderScanner } from "./injector/provider-scanner";
import { providerNameGenerate } from "./injector/provider-name-generate";
import { HookCenter } from "./hook/hook-center";
import { HookResolver } from "./hook/hook-resolver";
import { getInjectableMeta } from "./decorators/core";
import { InstanceWrapper } from "./injector";

/**
 * @publicApi
 */
export class CoreContext implements IJoyContext {
  protected isInitialized = false;

  private instanceLoader: InstanceLoader;
  private dependenciesScanner: ProviderScanner;
  protected readonly hookCenter: HookCenter;
  protected readonly injector;

  public hasInitialized(): boolean {
    return this.isInitialized;
  }

  constructor(
    protected readonly entry: EntryType,
    public readonly container: JoyContainer = new JoyContainer()
  ) {
    this.hookCenter = new HookCenter();
    this.injector = new Injector(this.hookCenter);
    this.dependenciesScanner = new ProviderScanner(container);
    this.instanceLoader = new InstanceLoader(container, this.injector);

    this.hookCenter.registerProviderHooks(this.container, JoyContainer);

    this.initInternalProvider();
  }

  private initInternalProvider(): void {
    this.registerInternalModules({
      tempoContext: {
        id: "tempoContext",
        // @ts-ignore
        type: this.constructor,
        useValue: this,
      },
      providerScanner: {
        id: "providerScanner",
        type: ProviderScanner,
        useValue: this.dependenciesScanner,
      },
      hookCenter: {
        id: "hookCenter",
        type: HookCenter,
        useValue: this.hookCenter,
      },
      hookResolver: {
        id: "hookResolver",
        type: HookResolver,
        useValue: new HookResolver(this.hookCenter),
      },
    });

    // this.container.addProvider({
    //   id: "tempoContext",
    //   // @ts-ignore
    //   type: this.constructor,
    //   useValue: this,
    // })
    // this.container.addProvider({
    //   id: "hookCenter",
    //   type: HookCenter,
    //   useValue: this.hookCenter,
    // })
    // this.container.addProvider({
    //   id: "hookResolver",
    //   type: HookResolver,
    //   useValue: new HookResolver(this.hookCenter),
    // })
  }

  protected registerInternalModules(moduleConfig: EntryType) {
    const providers = this.dependenciesScanner.scan(moduleConfig);
    this.container.addProviders(providers);
  }

  private async loadInternalModule(): Promise<void> {
    const internalProviderIds = this.container.getProviderNames();
    const providerIds = Array.from(internalProviderIds);
    await this.instanceLoader.createInstancesOfDependencies(providerIds);
  }

  public async loadModule(module: EntryType | EntryType[]): Promise<void> {
    console.log(">>>> entry loadModule", module);
    const providers = this.dependenciesScanner.scan(module);
    this.container.addProviders(providers);
    const providerIds = providers.map((it) => it.id);
    console.log(">>>>>> scan out providerIds:", providerIds);
    await this.instanceLoader.createInstancesOfDependencies(providerIds);
  }

  public getProviderDefinition<TInput = any>(
    typeOrToken: TypeOrTokenType<TInput>
  ): InstanceWrapper<TInput> | undefined {
    const instanceWrapper = this.container.getProvider(typeOrToken);
    return instanceWrapper;
  }

  public get<TInput = any>(
    typeOrToken: TypeOrTokenType<TInput>,
    options: { optional?: boolean; strict?: boolean } = { optional: false }
  ): Promise<TInput> | TInput | undefined {
    const providerId = this.getProviderId(typeOrToken);

    const instanceWrapper = this.container.getProvider(typeOrToken);
    if (isNil(instanceWrapper)) {
      if (options.optional) {
        return undefined;
      }
      throw new UnknownElementException(providerId);
    }

    const provider = this.injector.loadProvider(
      instanceWrapper,
      this.container
    );
    return provider as Promise<TInput> | TInput;
  }

  public syncGetProvider<TInput = any>(
    typeOrToken: TypeOrTokenType<TInput>,
    options: { strict?: boolean; optional?: boolean } = {
      strict: false,
      optional: false,
    }
  ): TInput | undefined {
    const loadRst = this.get<TInput>(typeOrToken, options);
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
    typeOfInstance: TypeOrTokenType<unknown>
  ): ThenableResult<IInjectableDependency[]> {
    const providerId: string = this.getProviderId(typeOfInstance);
    let instanceWrapper = this.container.getProvider(providerId);
    if (isNil(instanceWrapper)) {
      // 生成一个临时的wrapper，用于缓存注入信息
      const provider: ClassProvider = {
        id: providerId,
        type: typeOfInstance as Type,
        useClass: typeOfInstance as Type, // todo 限定为只能是类型
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
    await this.loadInternalModule();
    await this.loadModule(this.entry);
    this.isInitialized = true;
    return this;
  }

  protected async dispose(): Promise<void> {
    // core application context has no application
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
    if (isFunction(typeOrToken)) {
      const meta = getInjectableMeta(typeOrToken);
      if (meta?.id) {
        return meta.id;
      } else {
        return providerNameGenerate(typeOrToken);
      }
    } else {
      return typeOrToken as string;
    }
  }
}
