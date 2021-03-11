import {
  ClassProvider,
  FactoryProvider,
  Provider,
  Scope,
  Type,
  ValueProvider,
} from "../interfaces";
import { randomStringGenerator } from "../utils/random-string-generator.util";
import { isNil, isUndefined } from "../utils/shared.utils";
import { STATIC_CONTEXT } from "./constants";
import { TaskThenable } from "../utils/task-thenable";

export const INSTANCE_METADATA_SYMBOL = Symbol.for("instance_metadata:cache");
export const INSTANCE_ID_SYMBOL = Symbol.for("instance_metadata:id");

export interface ContextId {
  readonly id: number;
}

export interface InstancePerContext<T> {
  instance: T;
  isResolved?: boolean;
  isPending?: boolean;
  donePromise?: Promise<T>;
  loadTask?: TaskThenable<T>;
}
export interface PropertyMetadata {
  key: string;
  wrapper: InstanceWrapper;
}

interface InstanceMetadataStore {
  dependencies?: InstanceWrapper[];
  properties?: PropertyMetadata[];
  enhancers?: InstanceWrapper[];
}

export class InstanceWrapper<T = any> {
  public readonly name: string;
  public readonly async?: boolean;
  public readonly module?: any;
  public readonly scope?: Scope = Scope.DEFAULT;
  public type: Type<T>;
  public factory?: (...args: any) => any;
  public inject?: (string | Type<any>)[];
  public forwardRef?: boolean;

  private readonly values = new WeakMap<ContextId, InstancePerContext<T>>();
  private readonly [INSTANCE_METADATA_SYMBOL]: InstanceMetadataStore = {};
  private readonly [INSTANCE_ID_SYMBOL]: string;
  private transientMap?:
    | Map<string, WeakMap<ContextId, InstancePerContext<T>>>
    | undefined;
  private isTreeStatic: boolean | undefined;

  constructor(
    metadata: Partial<InstanceWrapper<T>> & Partial<InstancePerContext<T>> = {}
  ) {
    this[INSTANCE_ID_SYMBOL] = randomStringGenerator();
    this.initialize(metadata);
  }

  get id(): string {
    return this[INSTANCE_ID_SYMBOL];
  }

  set instance(value: T) {
    this.values.set(STATIC_CONTEXT, { instance: value });
  }

  get instance(): T {
    const instancePerContext = this.getInstanceByContextId(STATIC_CONTEXT);
    return instancePerContext.instance;
  }

  get isNotMetatype(): boolean {
    const isFactory = this.type && !isNil(this.inject);
    return !this.type || isFactory;
  }

  get isTransient(): boolean {
    return this.scope === Scope.TRANSIENT;
  }

  private getInstanceByStaticContext(): InstancePerContext<T> {
    return this.values.get(STATIC_CONTEXT);
  }

  public getInstanceByContextId(contextId: ContextId): InstancePerContext<T> {
    if (this.scope === Scope.TRANSIENT) {
      return this.cloneTransientInstance(contextId);
    }
    const instancePerContext = this.values.get(contextId);
    return instancePerContext
      ? instancePerContext
      : this.cloneStaticInstance(contextId);
  }

  public getInstanceByInquirerId(
    contextId: ContextId,
    inquirerId: string
  ): InstancePerContext<T> {
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

  public setInstanceByContextId(
    contextId: ContextId,
    value: InstancePerContext<T>,
    inquirerId?: string
  ) {
    if (this.scope === Scope.TRANSIENT && inquirerId) {
      return this.setInstanceByInquirerId(contextId, inquirerId, value);
    }
    this.values.set(contextId, value);
  }

  public setInstanceByInquirerId(
    contextId: ContextId,
    inquirerId: string,
    value: InstancePerContext<T>
  ) {
    let collection = this.transientMap.get(inquirerId);
    if (!collection) {
      collection = new WeakMap();
      this.transientMap.set(inquirerId, collection);
    }
    collection.set(contextId, value);
  }

  public addCtorMetadata(index: number, wrapper: InstanceWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].dependencies) {
      this[INSTANCE_METADATA_SYMBOL].dependencies = [];
    }
    this[INSTANCE_METADATA_SYMBOL].dependencies[index] = wrapper;
  }

  public getCtorMetadata(): InstanceWrapper[] {
    return this[INSTANCE_METADATA_SYMBOL].dependencies;
  }

  public addPropertiesMetadata(key: string, wrapper: InstanceWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].properties) {
      this[INSTANCE_METADATA_SYMBOL].properties = [];
    }
    this[INSTANCE_METADATA_SYMBOL].properties.push({
      key,
      wrapper,
    });
  }

  public getPropertiesMetadata(): PropertyMetadata[] {
    return this[INSTANCE_METADATA_SYMBOL].properties;
  }

  public addEnhancerMetadata(wrapper: InstanceWrapper) {
    if (!this[INSTANCE_METADATA_SYMBOL].enhancers) {
      this[INSTANCE_METADATA_SYMBOL].enhancers = [];
    }
    this[INSTANCE_METADATA_SYMBOL].enhancers.push(wrapper);
  }

  public getEnhancersMetadata(): InstanceWrapper[] {
    return this[INSTANCE_METADATA_SYMBOL].enhancers;
  }

  public isDependencyTreeStatic(lookupRegistry: string[] = []): boolean {
    if (!isUndefined(this.isTreeStatic)) {
      return this.isTreeStatic;
    }
    if (this.scope === Scope.REQUEST) {
      this.isTreeStatic = false;
      return this.isTreeStatic;
    }
    if (lookupRegistry.includes(this[INSTANCE_ID_SYMBOL])) {
      return true;
    }
    lookupRegistry = lookupRegistry.concat(this[INSTANCE_ID_SYMBOL]);

    const { dependencies, properties, enhancers } = this[
      INSTANCE_METADATA_SYMBOL
    ];
    let isStatic =
      (dependencies &&
        this.isWrapperListStatic(dependencies, lookupRegistry)) ||
      !dependencies;

    if (!isStatic || !(properties || enhancers)) {
      this.isTreeStatic = isStatic;
      return this.isTreeStatic;
    }
    const propertiesHosts = (properties || []).map((item) => item.wrapper);
    isStatic =
      isStatic && this.isWrapperListStatic(propertiesHosts, lookupRegistry);
    if (!isStatic || !enhancers) {
      this.isTreeStatic = isStatic;
      return this.isTreeStatic;
    }
    this.isTreeStatic = this.isWrapperListStatic(enhancers, lookupRegistry);
    return this.isTreeStatic;
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

  public isInRequestScope(
    contextId: ContextId,
    inquirer?: InstanceWrapper | undefined
  ): boolean {
    const isDependencyTreeStatic = this.isDependencyTreeStatic();

    return ((!isDependencyTreeStatic &&
      contextId !== STATIC_CONTEXT &&
      (!this.isTransient || (this.isTransient && inquirer))) as any) as boolean;
  }

  public isLazyTransient(
    contextId: ContextId,
    inquirer: InstanceWrapper | undefined
  ): boolean {
    const isInquirerRequestScoped =
      inquirer && !inquirer.isDependencyTreeStatic();

    return (
      this.isDependencyTreeStatic() &&
      contextId !== STATIC_CONTEXT &&
      this.isTransient &&
      isInquirerRequestScoped
    );
  }

  public isStatic(
    contextId: ContextId,
    inquirer: InstanceWrapper | undefined
  ): boolean {
    const isInquirerRequestScoped =
      inquirer && !inquirer.isDependencyTreeStatic();
    const isStaticTransient = this.isTransient && !isInquirerRequestScoped;

    return (
      this.isDependencyTreeStatic() &&
      contextId === STATIC_CONTEXT &&
      (!this.isTransient || (isStaticTransient && !!inquirer))
    );
  }

  public getStaticTransientInstances() {
    if (!this.transientMap) {
      return [];
    }
    const instances = [...this.transientMap.values()];
    return instances
      .map((item) => item.get(STATIC_CONTEXT))
      .filter((item) => !!item);
  }

  public mergeWith(provider: Provider) {
    if ((provider as ValueProvider).useValue) {
      this.type = null;
      this.inject = null;

      this.setInstanceByContextId(STATIC_CONTEXT, {
        instance: (provider as ValueProvider).useValue,
        isResolved: true,
        isPending: false,
      });
    } else if ((provider as ClassProvider).useClass) {
      this.inject = null;
      this.type = (provider as ClassProvider).useClass;
    } else if ((provider as FactoryProvider).useFactory) {
      this.type = (provider as FactoryProvider).type;
      this.factory = (provider as FactoryProvider).useFactory;
      this.inject = (provider as FactoryProvider).inject || [];
    }
  }

  private isNewable(): boolean {
    return isNil(this.inject) && this.type && this.type.prototype;
  }

  private isWrapperListStatic(
    tree: InstanceWrapper[],
    lookupRegistry: string[]
  ): boolean {
    return tree.every((item: InstanceWrapper) =>
      item.isDependencyTreeStatic(lookupRegistry)
    );
  }

  private initialize(
    metadata: Partial<InstanceWrapper<T>> & Partial<InstancePerContext<T>>
  ) {
    const { instance, isResolved, ...wrapperPartial } = metadata;
    Object.assign(this, wrapperPartial);

    this.setInstanceByContextId(STATIC_CONTEXT, {
      instance,
      isResolved,
    });
    this.scope === Scope.TRANSIENT && (this.transientMap = new Map());
  }
}
