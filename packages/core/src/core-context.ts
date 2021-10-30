import { ClassProvider, EntryType, ICoreContext, Scope, Type, TypeOrTokenType } from "./interfaces";
import { Logger, LoggerService } from "./services/logger.service";
import { isFunction, isNil } from "./utils/shared.utils";
import { UnknownElementException } from "./errors/exceptions/unknown-element.exception";
import { CoreContainer } from "./injector/core-container";
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
import { getComponentMeta } from "./decorators/core";
import { ComponentWrapper } from "./injector";
import { HookType, IHook } from "./hook";

interface CoreContextEventListener {
  onContextInitialized(): Promise<void>;

  onContextBeforeDispose(): Promise<void>;

  onBeforeShutdownHook(): Promise<void>;

  onShutdownHook(): Promise<void>;
}

/**
 * @publicApi
 */
export class CoreContext implements ICoreContext {
  protected isInitialized = false;

  protected instanceLoader: InstanceLoader;
  protected dependenciesScanner: ProviderScanner;
  protected readonly hookCenter: HookCenter;
  protected readonly hookResolver: HookResolver;
  protected readonly injector;

  public hasInitialized(): boolean {
    return this.isInitialized;
  }

  constructor(protected readonly entry: EntryType | EntryType[], public readonly container: CoreContainer = new CoreContainer()) {
    this.hookCenter = new HookCenter();
    this.injector = new Injector(this.hookCenter);
    this.dependenciesScanner = new ProviderScanner();
    this.instanceLoader = new InstanceLoader(container, this.injector);
    this.registerHooks();

    this.registerCoreProviders();
    this.hookResolver = new HookResolver(this.hookCenter);
  }

  // @AutowireHook({type: HookType.Traverse, async: true})
  public onDidProvidersRegister: IHook;

  // @AutowireHook({type: HookType.Traverse, async: true})
  public onContextInitialized: IHook;

  // @AutowireHook({type: HookType.Traverse, async: true})
  public onContextBeforeDispose: IHook;

  // @AutowireHook({type: HookType.Traverse, async: true})
  public onBeforeShutdownHook: IHook;

  // @AutowireHook({type: HookType.Traverse, async: true})
  public onShutdownHook: IHook;

  private registerHooks() {
    this.hookCenter.registerProviderHooks(this.container);

    this.onDidProvidersRegister = this.hookCenter.registerHook({
      id: "onDidProvidersRegister",
      type: HookType.Traverse,
      async: true,
      parallel: false,
    });

    this.onContextInitialized = this.hookCenter.registerHook({
      id: "onContextInitialized",
      type: HookType.Traverse,
      async: true,
      parallel: false,
    });
    this.onContextBeforeDispose = this.hookCenter.registerHook({
      id: "onContextBeforeDispose",
      type: HookType.Traverse,
      async: true,
      parallel: false,
    });
    this.onBeforeShutdownHook = this.hookCenter.registerHook({
      id: "onBeforeShutdownHook",
      type: HookType.Traverse,
      async: true,
      parallel: false,
    });
    this.onShutdownHook = this.hookCenter.registerHook({
      id: "onShutdownHook",
      type: HookType.Traverse,
      async: true,
      parallel: false,
    });
  }

  private registerCoreProviders() {
    this.container.addProviders([
      {
        name: Symbol("coreContext"),
        type: this.constructor,
        useValue: this,
      },
      {
        name: Symbol("providerScanner"),
        type: ProviderScanner,
        useValue: this.dependenciesScanner,
      },
      {
        name: Symbol("hookCenter"),
        type: HookCenter,
        useValue: this.hookCenter,
      },
    ]);
  }

  public getProviderDefinition<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, packageName?: string): ComponentWrapper<TInput> | undefined {
    const instanceWrapper = this.container.getProvider(typeOrToken, packageName);
    return instanceWrapper;
  }

  public tryGet<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): Promise<TInput> | TInput | undefined {
    const instanceWrapper = this.container.getProvider(typeOrToken);
    if (isNil(instanceWrapper)) {
      return undefined;
    }

    const provider = this.injector.loadProvider(instanceWrapper, this.container);
    return provider as Promise<TInput> | TInput;
  }

  public get<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): Promise<TInput> | TInput {
    const instance = this.tryGet<TInput>(typeOrToken, options);
    if (isNil(instance)) {
      const providerId = this.getProviderId(typeOrToken);
      throw new UnknownElementException(providerId);
    }
    return instance as Promise<TInput> | TInput;
  }

  public syncTryGet<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): TInput | undefined {
    const loadRst = this.tryGet<TInput>(typeOrToken, options);
    if (loadRst instanceof Promise) {
      throw new RuntimeException("Its an async provider, can not load as sync");
    }
    return loadRst;
  }

  public syncGet<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): TInput {
    const loadRst = this.get<TInput>(typeOrToken, options);
    if (loadRst instanceof Promise) {
      throw new RuntimeException("Its an async provider, can not load as sync");
    }
    return loadRst;
  }

  /**
   * inject properties for instance
   */
  public resolveProperties<TInstance>(instance: TInstance, typeOfInstance: TypeOrTokenType<unknown>): ThenableResult<IInjectableDependency[]> {
    const providerId: string = this.getProviderId(typeOfInstance);
    let instanceWrapper = this.container.getProvider(providerId);
    if (isNil(instanceWrapper)) {
      // 生成一个临时的wrapper，用于缓存注入信息
      const provider: ClassProvider = {
        name: providerId,
        type: typeOfInstance as Type,
        useClass: typeOfInstance as Type, // todo 限定为只能是类型
        scope: Scope.DEFAULT,
      };
      instanceWrapper = this.container.addProvider(provider);
    }
    const injectedProps = this.injector.loadInstanceProperties(instance, instanceWrapper, this.container, STATIC_CONTEXT).getResult();

    return injectedProps;
  }

  protected async initContext(): Promise<void> {}

  public registerModule(module: EntryType | EntryType[]): ComponentWrapper[] {
    const providers = this.dependenciesScanner.scan(module);
    const wrappers = this.container.addProviders(providers);
    return wrappers;
  }

  public async loadModule(module: EntryType | EntryType[]): Promise<ComponentWrapper[]> {
    const providers = this.registerModule(module);
    await this.initProviders(providers);
    // await this.triggerInstanceOnModuleLoad(providerIds)
    return providers;
  }

  /**
   * Initalizes the application.
   * Calls the Joy lifecycle events.
   *
   * @returns {Promise<this>} The JoyApplicationContext instance as Promise
   */
  public async init(): Promise<this> {
    if (this.isInitialized) {
      return this;
    }
    await this.initContext();
    let providers = this.registerModule(this.entry);
    await this.initProviders(providers);

    this.isInitialized = true;
    await this.onContextInitialized.call();

    return this;
  }

  protected async initProviders(instanceWrappers: ComponentWrapper[]): Promise<void> {
    // this.hookCenter.registerHooksFromWrappers(instanceWrappers);
    await this.createInstancesOfDependencies(instanceWrappers);
    await this.onDidProvidersRegister.call(instanceWrappers);
  }

  protected createInstancesOfDependencies(instanceWrappers: ComponentWrapper[]): Promise<unknown[]> {
    return this.instanceLoader.createInstancesOfDependencies(instanceWrappers);
  }

  protected async dispose(): Promise<void> {
    // core application context has no application
    // to dispose, therefore just call a noop
    return Promise.resolve();
  }

  public async close(): Promise<void> {
    await this.onContextBeforeDispose.call();
    await this.onBeforeShutdownHook.call();
    await this.dispose();
    await this.onShutdownHook.call();
  }

  public useLogger(logger: LoggerService) {
    Logger.overrideLogger(logger);
  }

  private getProviderId(typeOrToken: TypeOrTokenType<unknown>): string {
    if (isFunction(typeOrToken)) {
      const meta = getComponentMeta(typeOrToken);
      if (meta?.name) {
        return meta.name.toString();
      } else {
        return providerNameGenerate(typeOrToken);
      }
    } else {
      return typeOrToken as string;
    }
  }

  // private async triggerInstanceOnModuleLoad(providerIds: string[]): Promise<void> {
  //   for (const providerId of providerIds) {
  //     const wrapper = this.container.getProviderById(providerId)
  //     if (!wrapper || wrapper.scope !== Scope.DEFAULT || !wrapper.useClass) {
  //       continue;
  //     }
  //     const clazz = wrapper.useClass
  //     const onDidLoadMethodKey = getOnDidLoadMethodKey(clazz)
  //     if(onDidLoadMethodKey){
  //       const instance = this.get(clazz)
  //       if (typeof instance[onDidLoadMethodKey] !== "function"){
  //         throw new RuntimeException(`OnDidLoad callback method is not a function. class name: ${clazz.name}`)
  //       }
  //      await instance[onDidLoadMethodKey].call(instance)
  //     }
  //   }
  // }
}
