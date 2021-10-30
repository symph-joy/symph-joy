import { Abstract, ClassProvider, FactoryProvider, Provider, Scope, TProviderName, Type, ValueProvider } from "../interfaces";
import { randomStringGenerator } from "../utils/random-string-generator.util";
import { isNil } from "../utils/shared.utils";
import { STATIC_CONTEXT } from "./constants";
import { TaskThenable } from "../utils/task-thenable";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { InjectCustomOptionsInterface } from "../interfaces/inject-custom-options.interface";

export const INSTANCE_METADATA_SYMBOL = Symbol.for("instance_metadata:cache");
export const INSTANCE_ID_SYMBOL = Symbol.for("instance_metadata:id");

export interface ContextId {
  readonly id: number;
}

export interface InstancePerContext<T> {
  instance?: T;
  isResolved?: boolean;
  isPending?: boolean;
  donePromise?: Promise<T>;
  loadTask?: TaskThenable<T>;
  readonly id: string;
}
export interface PropertyMetadata {
  key: string;
  wrapper: ComponentWrapper;
}

interface InstanceMetadataStore {
  dependencies?: ComponentWrapper[];
  properties?: PropertyMetadata[];
  enhancers?: ComponentWrapper[];
}

export interface IComponentWrapper<T = any> {
  readonly id: string;
  readonly name: TProviderName | TProviderName[];
  readonly async?: boolean;
  readonly scope?: Scope;
  type: Type<T> | Abstract<T>;
}

export type InstanceBy = "class" | "factory" | "value";
export type ComponentWrapperOptions<T = any> = Partial<ComponentWrapper<T>> & Partial<InstancePerContext<T>>;

export class ComponentWrapper<T = any> implements IComponentWrapper {
  public readonly name: TProviderName;
  public readonly alias: TProviderName[];
  public readonly package?: string;
  public readonly global = false as boolean; // 如果为false，只有通过明确的包名，才能找到该Component，无法通过匿名包名或全局找到。
  public readonly async?: boolean;
  // public readonly module?: any;
  public readonly scope?: Scope = Scope.DEFAULT;
  public type: Type<T> | Abstract<T>;
  public factory?: ((...args: any[]) => T) | { factory: Type; property: string }; // useFactory
  public inject?: (string | Type<any> | InjectCustomOptionsInterface)[];
  public forwardRef?: boolean;

  public autoLoad: boolean | "lazy";
  public instanceBy: InstanceBy;
  public useClass?: Type<T> | Function; // when instanceBy class, it's used to instance the object

  private readonly values = new WeakMap<ContextId, InstancePerContext<T>>();
  private readonly [INSTANCE_METADATA_SYMBOL]: InstanceMetadataStore;
  private readonly [INSTANCE_ID_SYMBOL]: string;
  private transientMap?: Map<string, WeakMap<ContextId, InstancePerContext<T>>> | undefined;
  // private isTreeStatic: boolean | undefined;
  public hasInstanced: boolean; // where has been loaded by other component

  constructor(metadata: ComponentWrapperOptions<T> = {}) {
    const name = String(metadata.name || "") + "-";
    this[INSTANCE_METADATA_SYMBOL] = {};
    this[INSTANCE_ID_SYMBOL] = name + randomStringGenerator();
    this.initialize(metadata);
  }

  get id(): string {
    return this[INSTANCE_ID_SYMBOL];
  }

  set instance(value: T) {
    this.values.set(STATIC_CONTEXT, {
      id: this.id,
      instance: value,
    });
  }

  get instance(): T {
    const instancePerContext = this.getInstanceByContextId(STATIC_CONTEXT);
    return instancePerContext.instance!;
  }

  get isNotMetatype(): boolean {
    const isFactory = this.type && !isNil(this.inject);
    return !this.type || isFactory;
  }

  get isTransient(): boolean {
    return this.scope === Scope.TRANSIENT;
  }

  private getInstanceByStaticContext(): InstancePerContext<T> {
    return this.values.get(STATIC_CONTEXT)!;
  }

  public getInstanceByContextId(contextId: ContextId): InstancePerContext<T> {
    if (!this.hasInstanced) {
      this.hasInstanced = true;
    }

    if (this.scope === Scope.TRANSIENT) {
      return this.cloneTransientInstance(contextId);
    }
    const instancePerContext = this.values.get(contextId);
    return instancePerContext ? instancePerContext : this.cloneStaticInstance(contextId);
  }

  // todo remove
  public getInstanceByInquirerId(contextId: ContextId, inquirerId: string): InstancePerContext<T> {
    // let collectionPerContext = this.transientMap.get(inquirerId);
    // if (!collectionPerContext) {
    //   collectionPerContext = new WeakMap();
    //   this.transientMap.set(inquirerId, collectionPerContext);
    // }
    // const instancePerContext = collectionPerContext.get(contextId);
    // return instancePerContext
    //   ? instancePerContext
    //   : this.cloneTransientInstance(contextId, inquirerId);
    return this.cloneTransientInstance(contextId);
  }

  public setInstanceByContextId(contextId: ContextId, value: InstancePerContext<T>, inquirerId?: string) {
    if (this.scope === Scope.TRANSIENT && inquirerId) {
      return this.setInstanceByInquirerId(contextId, inquirerId, value);
    }
    this.values.set(contextId, value);
  }

  public setInstanceByInquirerId(contextId: ContextId, inquirerId: string, value: InstancePerContext<T>) {
    let collection = this.transientMap?.get(inquirerId);
    if (!collection) {
      collection = new WeakMap();
      this.transientMap!.set(inquirerId, collection);
    }
    collection.set(contextId, value);
  }

  public addCtorMetadata(index: number, wrapper: ComponentWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].dependencies) {
      this[INSTANCE_METADATA_SYMBOL].dependencies = [];
    }
    this[INSTANCE_METADATA_SYMBOL].dependencies![index] = wrapper;
  }

  public getCtorMetadata(): ComponentWrapper[] | undefined {
    return this[INSTANCE_METADATA_SYMBOL].dependencies;
  }

  public addPropertiesMetadata(key: string, wrapper: ComponentWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].properties) {
      this[INSTANCE_METADATA_SYMBOL].properties = [];
    }
    this[INSTANCE_METADATA_SYMBOL].properties!.push({
      key,
      wrapper,
    });
  }

  public getPropertiesMetadata(): PropertyMetadata[] | undefined {
    return this[INSTANCE_METADATA_SYMBOL].properties;
  }

  public addEnhancerMetadata(wrapper: ComponentWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].enhancers) {
      this[INSTANCE_METADATA_SYMBOL].enhancers = [];
    }
    this[INSTANCE_METADATA_SYMBOL].enhancers!.push(wrapper);
  }

  public getEnhancersMetadata(): ComponentWrapper[] | undefined {
    return this[INSTANCE_METADATA_SYMBOL].enhancers;
  }

  public isDependencyTreeStatic(): boolean {
    if (this.scope === Scope.DEFAULT) {
      return true;
    }
    return false;
  }

  public cloneStaticInstance(contextId: ContextId): InstancePerContext<T> {
    const staticInstance = this.getInstanceByStaticContext();
    if (this.isDependencyTreeStatic()) {
      return staticInstance;
    }
    const instancePerContext: InstancePerContext<T> = {
      ...staticInstance,
      instance: undefined,
      isResolved: false,
      isPending: false,
    };
    if (this.isNewable()) {
      instancePerContext.instance = Object.create(this.type.prototype);
    }
    this.setInstanceByContextId(contextId, instancePerContext);
    return instancePerContext;
  }

  public cloneTransientInstance(contextId: ContextId): InstancePerContext<T> {
    const staticInstance = this.getInstanceByStaticContext();
    const instancePerContext: InstancePerContext<T> = {
      ...staticInstance,
      instance: undefined,
      isResolved: false,
      isPending: false,
    };
    if (this.isNewable()) {
      instancePerContext.instance = Object.create(this.type.prototype);
    }
    // will not save instance, the transient instance will mananged by inquirer
    // this.setInstanceByInquirerId(contextId, inquirerId, instancePerContext);
    return instancePerContext;
  }

  public createPrototype(contextId: ContextId) {
    const host = this.getInstanceByContextId(contextId);
    if (!this.isNewable() || host.isResolved) {
      return;
    }
    return Object.create(this.type.prototype);
  }

  public isInRequestScope(contextId: ContextId, inquirer?: ComponentWrapper | undefined): boolean {
    const isDependencyTreeStatic = this.isDependencyTreeStatic();

    return ((!isDependencyTreeStatic && contextId !== STATIC_CONTEXT && (!this.isTransient || (this.isTransient && inquirer))) as any) as boolean;
  }

  public isLazyTransient(contextId: ContextId, inquirer: ComponentWrapper | undefined): boolean {
    const isInquirerRequestScoped = inquirer && !inquirer.isDependencyTreeStatic();

    return !!(this.isDependencyTreeStatic() && contextId !== STATIC_CONTEXT && this.isTransient && isInquirerRequestScoped);
  }

  public isStatic(contextId: ContextId, inquirer: ComponentWrapper | undefined): boolean {
    const isInquirerRequestScoped = inquirer && !inquirer.isDependencyTreeStatic();
    const isStaticTransient = this.isTransient && !isInquirerRequestScoped;

    return this.isDependencyTreeStatic() && contextId === STATIC_CONTEXT && (!this.isTransient || (isStaticTransient && !!inquirer));
  }

  public getStaticTransientInstances() {
    if (!this.transientMap) {
      return [];
    }
    const instances = [...this.transientMap.values()];
    return instances.map((item) => item.get(STATIC_CONTEXT)).filter((item) => !!item);
  }

  /**
   * todo 已经生成的实例，如何替换为新的类型？ 包括单例和多例模式下生成的实例。
   *
   * @param provider
   */
  public replaceWith(provider: Partial<Provider>) {
    if (provider.type) {
      this.type = provider.type;
    }

    if ((provider as any).useValue) {
      this.setInstanceByContextId(STATIC_CONTEXT, (provider as ValueProvider).useValue);
    } else if ((provider as any).useClass) {
      const { type, scope, lazyRegister, useClass } = provider as ClassProvider;
      Object.assign(this, {
        type,
        scope,
        autoLoad: lazyRegister,
        useClass,
        inject: null,
      });
      this.values.delete(STATIC_CONTEXT);
    } else if ((provider as any).useFactory) {
      const { useFactory, inject, scope } = provider as FactoryProvider;
      Object.assign(this, { useFactory, inject: inject || [], scope });
      this.values.delete(STATIC_CONTEXT);
    } else {
      throw new RuntimeException(`Unknown provider type, provider ${this.name.toString()} merge provider ${JSON.stringify(provider)} failed.`);
    }
  }

  private isNewable(): boolean {
    return isNil(this.inject) && this.type && this.type.prototype;
  }

  // private isWrapperListStatic(
  //   tree: ComponentWrapper[],
  //   lookupRegistry: string[]
  // ): boolean {
  //   return tree.every((item: ComponentWrapper) =>
  //     item.isDependencyTreeStatic(lookupRegistry)
  //   );
  // }

  private initialize(metadata: Partial<ComponentWrapper<T>> & Partial<InstancePerContext<T>>) {
    const { instance, isResolved, ...wrapperPartial } = metadata;
    Object.assign(this, wrapperPartial);

    this.setInstanceByContextId(STATIC_CONTEXT, {
      id: this.id,
      instance,
      isResolved,
    });
    this.scope === Scope.TRANSIENT && (this.transientMap = new Map());
  }

  // public toString(): string{
  //   const {name, alias, type, scope} = this
  //   return JSON.stringify({name, alias, type: type?.name, scope})
  // }
}
