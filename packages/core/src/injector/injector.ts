import {
  OPTIONAL_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
  PARAMTYPES_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from "../constants";
import { EnuInjectBy, IInjectableDependency, Scope, Type } from "../interfaces";
import { isFunction, isNil, isObject, isPromise, isSubClass, isUndefined } from "../utils/shared.utils";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { UndefinedDependencyException } from "../errors/exceptions/undefined-dependency.exception";
import { UnknownDependenciesException } from "../errors/exceptions/unknown-dependencies.exception";
import { STATIC_CONTEXT } from "./constants";
import { ComponentWrapper, ContextId, IComponentWrapper, InstancePerContext, PropertyMetadata } from "./component-wrapper";
import { TaskThenable, ThenableResult } from "../utils/task-thenable";
import { ApplicationContainer } from "./application-container";
import { providerNameGenerate } from "./provider-name-generate";
import { getComponentMeta } from "../decorators/core";
import { isComponentInfoAwareComp } from "../interfaces/context/component-info-aware.interface";
import { InvalidDependencyTypeException } from "../errors/exceptions/invalid-dependency-type.exception";
import { HookType, IHook } from "../hook/interface/hook.interface";
import { NotUniqueMatchedProviderException } from "../errors/exceptions/not-unique-matched-provider.exception";
import { InjectCustomOptionsInterface } from "../interfaces/inject-custom-options.interface";
import { isApplicationContextAwareComp } from "../interfaces/context/application-context-ware.interface";
import { ApplicationContext } from "../application-context";
import { AutowireHook } from "../hook";
// const SyncThenable = Promise
// type SyncThenable<T> = Promise<T>
/**
 * The type of an injectable dependency
 */
export type InjectorDependency = Type<any> | string | InjectCustomOptionsInterface;

/**
 * load property-based dependency
 */
interface PropertyDependencyLoadTask extends IInjectableDependency {
  isResolved: boolean;
  loadTask?: TaskThenable<any>;
}

/**
 * Context of a dependency which gets injected by
 * the injector
 */
export interface InjectorDependencyContext {
  /**
   * The name of the property key (property-based injection)
   */
  key?: string | symbol;
  /**
   * The name of the function or injection token
   */
  name?: string | symbol;
  /**
   * The index of the dependency which gets injected
   * from the dependencies array
   */
  index?: number;
  /**
   * The dependency array which gets injected
   */
  dependencies?: InjectorDependency[];
}

export interface InjectorHookTaps {
  componentAfterInitialize?<T>(instance: T, args: { instanceWrapper: IComponentWrapper }): T;
  componentAfterPropertiesSet?<T>(instance: T, args: { instanceWrapper: IComponentWrapper }): T;
}

export class Injector {
  @AutowireHook({ async: false, parallel: false, type: HookType.Waterfall })
  private componentAfterInitialize: IHook;
  @AutowireHook({ async: false, parallel: false, type: HookType.Waterfall })
  private componentAfterPropertiesSet: IHook;

  constructor(public container: ApplicationContainer, protected parentInjector?: Injector) {
    // this.container = appContent.container;
    // this.parentInjector = appContent.parent.injector
    // this.componentAfterInitialize = this.pluginCenter.registerHook({
    //   id: "componentAfterInitialize",
    //   async: false,
    //   parallel: false,
    //   type: HookType.Waterfall,
    // });
  }

  public loadProvider<T>(wrapper: ComponentWrapper<T>, contextId = STATIC_CONTEXT): ThenableResult<T> {
    const instance = this.loadInstance<T>(wrapper, contextId);
    // await this.loadEnhancersPerContext(wrapper, contextId, wrapper
    return instance.getResult();
  }

  public loadInstance<T>(wrapper: ComponentWrapper<T>, contextId = STATIC_CONTEXT): TaskThenable<T> {
    if (!wrapper.hasInstanced) {
      // 标记是否已经被加载过，已经加载和实例化的Component被替换和修改，将会带来很多未知的风险。
      wrapper.hasInstanced = true;
    }

    const instanceHost = wrapper.getInstanceByContextId(contextId);
    if (instanceHost.isResolved) {
      return TaskThenable.resolve(instanceHost.instance);
    }

    // 如果component未声明在本容器内，则尝试在父容器处理。
    if (!this.container.hasComponent(wrapper.id)) {
      if (this.parentInjector) {
        return this.parentInjector.loadInstance(wrapper, contextId);
      } else {
        throw new RuntimeException(
          `Instance component error, the component(id:${String(wrapper.id)},name:${String(wrapper.name)}) is not exists in context.`
        );
      }
    }

    if (wrapper.scope === Scope.DEFAULT && instanceHost.loadTask) {
      return instanceHost.loadTask;
    }

    const { name, inject } = wrapper;
    const targetWrapper = wrapper;
    if (isUndefined(targetWrapper)) {
      throw new RuntimeException();
    }

    const constructorDeps = this.resolveConstructorParams<T>(wrapper, inject, contextId);

    const loadTask = TaskThenable.all(constructorDeps)
      .then((deps: any[]) => {
        return this.instantiateClass(deps, instanceHost, wrapper, targetWrapper, contextId);
      })
      .then((instance: unknown) => {
        if (!isNil(inject)) {
          return instance;
        }
        return this.loadInstanceProperties(instance, wrapper, contextId).then((injectedProps: unknown[]) => {
          return instance;
        });
      })
      .then((instance: any) => {
        instance =
          this.componentAfterPropertiesSet?.call(instance, {
            instanceWrapper: wrapper,
          }) || instance;
        return instance;
      })
      .then((instance: any) => {
        if (isComponentInfoAwareComp(instance)) {
          instance.setProviderInfo({
            name: wrapper.name,
            type: wrapper.type,
            scope: wrapper.scope!,
          });
        }
        if (isApplicationContextAwareComp(instance)) {
          const contextWrapper = this.container.getProviderByType(ApplicationContext)!;
          const context = contextWrapper && this.loadProvider(contextWrapper);
          if (!context || context.then) {
            throw new RuntimeException(
              `Can not call setApplicationContext on component '${String(wrapper.name)}, because can not get app context instance.'`
            );
          }
          instance.setApplicationContext(context);
        }
        // if (isNil(inject) && isFunction(instance.afterPropertiesSet)) {
        //   const rst = instance.afterPropertiesSet();
        //   if (isPromise(rst)) {
        //     return new Promise((resolve, reject) => {
        //       rst.then(() => {
        //         resolve(instance);
        //       }, reject);
        //     });
        //   }
        // }
        return instance;
      })
      .then((instance: any) => {
        if (isFunction(instance.initialize)) {
          const rst = instance.initialize();
          if (isPromise(rst)) {
            return new Promise((resolve, reject) => {
              rst.then(() => {
                resolve(instance);
              }, reject);
            });
          }
        }
        return instance;
      })
      .then((instance: any) => {
        instance =
          this.componentAfterInitialize?.call(instance, {
            instanceWrapper: wrapper,
          }) || instance;
        instanceHost.isResolved = true;
        return instance;
      });

    instanceHost.loadTask = loadTask;

    return loadTask;
  }

  public loadInstanceProperties<T>(
    instance: unknown,
    wrapper: ComponentWrapper<T>,
    contextId = STATIC_CONTEXT
  ): TaskThenable<IInjectableDependency[]> {
    const properties = this.resolveProperties(wrapper, contextId);
    if (properties.length === 0) {
      return TaskThenable.resolve([]);
    }
    return TaskThenable.all(properties.map((i) => i.loadTask)).then((propertyInstances: any) => {
      properties.forEach((p, i) => {
        p.isResolved = true;
        p.instance = propertyInstances[i];
      });
      this.applyProperties(instance, properties);
      return properties;
    });
  }

  public resolveConstructorParams<T>(
    wrapper: ComponentWrapper<T>,
    inject: InjectorDependency[] | undefined,
    contextId = STATIC_CONTEXT
  ): (TaskThenable | undefined)[] {
    const metadata = wrapper.getCtorMetadata();
    if (metadata) {
      return this.loadCtorMetadata(metadata, contextId);
    }
    const dependencies = this.reflectConstructorParams(wrapper.type as Type<any>, inject);
    const optionalDependenciesIds = isNil(inject) ? this.reflectOptionalParams(wrapper.type as Type<any>) : [];

    return dependencies.map((param, index) => {
      try {
        return this.resolveSingleParam<T>(wrapper, param, contextId);
      } catch (err) {
        const isOptional = param.isOptional || (optionalDependenciesIds && optionalDependenciesIds.includes(index));
        if (!isOptional) {
          throw err;
        }
        return undefined;
      }
    });
  }

  /**
   * 获取构造函数中需要注入的依赖项
   */
  public reflectConstructorParams<T>(type: Type<T>, params: InjectorDependency[] | undefined): IInjectableDependency[] {
    let paramDeps: IInjectableDependency[] = [];
    // when useFactory or custom inject constructor params
    if (!isNil(params)) {
      paramDeps = params.map((param, index): IInjectableDependency => {
        let type: Type | undefined;
        let name: string | symbol | undefined;
        let injectBy: EnuInjectBy | undefined;
        let isOptional: boolean | undefined;
        if (typeof param === "object") {
          type = param.type;
          name = param.name;
          isOptional = param.isOptional;
          injectBy = type !== undefined ? EnuInjectBy.TYPE : EnuInjectBy.NAME;
        } else if (isFunction(param)) {
          type = param as Type;
          injectBy = EnuInjectBy.TYPE;
        } else {
          name = param as string;
          injectBy = EnuInjectBy.NAME;
        }
        return {
          index,
          name,
          type,
          designType: type,
          injectBy,
          isOptional,
        };
      });
      return paramDeps;
    }
    const cusParams = this.reflectCustomfParams<T>(type); // items that decorated by @Inject()
    let cusParamsMap: Map<number, IInjectableDependency>;
    if (cusParams && cusParams.length > 0) {
      cusParamsMap = new Map<number, IInjectableDependency>();
      for (const param of cusParams) {
        cusParamsMap.set(param.index!, param);
      }
    }

    const custructionParams = Reflect.getMetadata(PARAMTYPES_METADATA, type) || [];
    paramDeps = custructionParams.map((paramType: any, index: number) => {
      const cusParam = cusParamsMap && cusParamsMap.get(index);
      if (!isNil(cusParam)) return cusParam;
      if (paramType === Object) {
        //when not specified a type, or set as a interface
        throw new UndefinedDependencyException(`Constructor(${type.name}) argument(index:${index})`, {
          index: index,
          dependencies: custructionParams,
        });
      }
      return {
        index,
        name: providerNameGenerate(paramType),
        type: paramType,
        injectBy: EnuInjectBy.TYPE,
      } as IInjectableDependency;
    });
    return paramDeps;
  }

  public reflectOptionalParams<T>(type: Type<T>): any[] | undefined {
    return Reflect.getMetadata(OPTIONAL_DEPS_METADATA, type);
  }

  /**
   * 在构造函数参数中，通过@Inject()声明的依赖项
   * @param type
   */
  public reflectCustomfParams<T>(type: Type<T>): IInjectableDependency[] {
    return Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, type) || [];
  }

  public resolveSingleParam<T>(wrapper: ComponentWrapper<T>, dependency: IInjectableDependency, contextId = STATIC_CONTEXT): TaskThenable<unknown> {
    if (isUndefined(dependency)) {
      throw new UndefinedDependencyException(String(wrapper.name), dependency);
    }
    const { key, index, designType, name, type, injectBy } = dependency;

    if (injectBy === EnuInjectBy.TYPE && type === Object) {
      throw new InvalidDependencyTypeException(
        String(wrapper.name),
        index,
        undefined,
        `should not set Object type to ${String(wrapper.name)} argument at index [${index}]`
      );
    }

    let paramWrapper = this.getInstanceWrapper(injectBy, type, name, wrapper.package);

    if (isNil(paramWrapper) && !isNil(dependency.type)) {
      paramWrapper = this.dynamicAddWrapper(dependency.type, dependency.name);
    }

    if (isNil(paramWrapper)) {
      throw new UnknownDependenciesException(String(wrapper.name), dependency);
    }
    if (
      designType &&
      designType !== Object &&
      paramWrapper.type !== Object &&
      designType !== paramWrapper.type &&
      !isSubClass(paramWrapper.type, designType)
    ) {
      throw new InvalidDependencyTypeException(
        String(wrapper.name),
        index,
        key,
        `${paramWrapper.type.name} class provider can not set to ${type?.name} class`
      );
    }

    !isNil(key) ? wrapper.addPropertiesMetadata(key, paramWrapper) : wrapper.addCtorMetadata(index!, paramWrapper);

    return this.resolveInstance(paramWrapper, contextId);
  }

  public getInstanceWrapper(injectBy: EnuInjectBy.TYPE, type: Type): ComponentWrapper | undefined;

  public getInstanceWrapper(
    injectBy: EnuInjectBy.NAME,
    type: undefined,
    name: string | symbol,
    packageName: string | undefined
  ): ComponentWrapper | undefined;

  public getInstanceWrapper(
    injectBy: EnuInjectBy | undefined,
    type: Type | undefined,
    name: string | symbol | undefined,
    packageName?: string | undefined
  ): ComponentWrapper | undefined;

  public getInstanceWrapper(
    injectBy: EnuInjectBy | undefined,
    type: Type | undefined,
    name?: string | symbol,
    packageName?: string | undefined
  ): ComponentWrapper | undefined {
    const container = this.container;
    let instanceWrapper;
    if (type === undefined && name === undefined) {
      throw new Error("Can not find provider by type and name, the both are undefined.");
    }
    switch (injectBy) {
      case EnuInjectBy.TYPE:
        if (type === undefined) {
          throw new Error("Can not find provider by type, the type is undefined.");
        }
        instanceWrapper = container.getProviderByType(type);
        break;
      case EnuInjectBy.NAME:
        if (name === undefined) {
          throw new Error("Can not find provider by name, the name is undefined.");
        }
        instanceWrapper = container.getProviderByName(name, packageName);
        if (instanceWrapper && !isSubClass(instanceWrapper.type, type)) {
          // todo print warn log, but not interrupt running
        }
        break;
      case EnuInjectBy.TYPE_NAME:
      default:
        let err: Error | undefined;
        if (type !== undefined && type !== Object) {
          try {
            instanceWrapper = container.getProviderByType(type);
          } catch (e) {
            if (!(e instanceof NotUniqueMatchedProviderException)) {
              throw e;
            }
            err = e;
          }
        }
        if (!instanceWrapper && name !== undefined) {
          // then not found by type, or found out more than one provider
          instanceWrapper = container.getProviderByName(name, packageName);
        }
        if (!instanceWrapper && err) {
          throw err;
        }
    }

    if (!instanceWrapper && this.parentInjector) {
      instanceWrapper = this.parentInjector.getInstanceWrapper(injectBy, type, name, packageName);
    }
    return instanceWrapper;
  }

  private dynamicAddWrapper(type: Type, name?: string | symbol): ComponentWrapper | undefined {
    const meta = getComponentMeta(type);
    if (!meta || !meta.lazyRegister) {
      return undefined;
    }
    if (name) {
      meta.name = name;
    }
    return this.container.addProvider(meta);
  }

  public resolveParamToken<T>(wrapper: ComponentWrapper<T>, param: Type<any> | string | symbol | any) {
    if (!param.forwardRef) {
      return param;
    }
    wrapper.forwardRef = true;
    return param.forwardRef();
  }

  public resolveInstance<T>(instanceWrapper: ComponentWrapper<T>, contextId = STATIC_CONTEXT): TaskThenable<T> {
    return this.loadInstance(instanceWrapper, contextId);
  }

  public resolveProperties<T>(wrapper: ComponentWrapper<T>, contextId = STATIC_CONTEXT): PropertyDependencyLoadTask[] {
    const metadata = wrapper.getPropertiesMetadata();
    if (metadata) {
      return this.loadPropertiesMetadata(metadata, contextId);
    }
    const properties = this.reflectProperties(wrapper.type as Type<any>);

    return properties.map((propDep) => {
      let instanceRst;
      try {
        instanceRst = this.resolveSingleParam<T>(wrapper, propDep, contextId);
      } catch (e) {
        if (!propDep.isOptional) {
          throw e;
        }
      }

      return {
        ...propDep,
        isResolved: false,
        loadTask: instanceRst,
        instance: null,
      };
    });
  }

  public reflectProperties<T>(type: Type<T>): IInjectableDependency[] {
    const properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, type) || [];
    const optionalKeys: string[] = Reflect.getMetadata(OPTIONAL_PROPERTY_DEPS_METADATA, type) || [];

    return properties.map((item: any) => ({
      ...item,
      isOptional: optionalKeys.includes(item.key),
      isResolved: false,
    }));
  }

  public applyProperties<T = unknown>(instance: T, properties: IInjectableDependency[]): void {
    if (isObject(instance)) {
      properties.filter((item) => !isNil(item.instance)).forEach((item) => ((instance as any)[item.key!] = item.instance));
    }
  }

  public instantiateClass<T = any>(
    instances: any[],
    instanceHost: InstancePerContext<T>,
    wrapper: ComponentWrapper,
    targetMetatype: ComponentWrapper,
    contextId = STATIC_CONTEXT
  ): TaskThenable<T> | T {
    const { type, inject } = wrapper;
    if (isNil(inject)) {
      // instance by constructor
      instanceHost.instance = wrapper.forwardRef
        ? Object.assign(instanceHost.instance, new (type as Type<any>)(...instances))
        : new (type as Type<any>)(...instances);
      return instanceHost.instance!;
    } else {
      const factory = targetMetatype.factory!;
      if (typeof factory === "object") {
        // instance by configuration
        const { factory: factoryClass, property } = factory;
        const factoryWrapper = this.container.getProviderByType(factoryClass);
        if (isNil(factoryWrapper)) {
          throw new RuntimeException(`Instantiate factory provider failed, can not find factory instance(class: ${factoryClass.name}) in container.`);
        }
        return this.resolveInstance(factoryWrapper!, contextId).then((factoryInstance: any) => {
          const returnValue = factoryInstance[property](...instances);
          if (returnValue === null || returnValue === undefined) {
            throw new RuntimeException(
              `Instantiate factory provider(name: ${String(wrapper.name)}) failed, factory method return a null or undefined value.`
            );
          }
          instanceHost.instance = returnValue;
          return returnValue;
        });
      } else {
        // instance by factory function
        const returnValue = factory(...instances);
        if (returnValue === null || returnValue === undefined) {
          throw new RuntimeException(
            `Instantiate factory provider(name: ${String(wrapper.name)}) failed, factory method return a null or undefined value.`
          );
        }
        instanceHost.instance = returnValue;
        return returnValue;
      }
    }
  }

  public async loadEnhancersPerContext(wrapper: ComponentWrapper, container: ApplicationContainer, ctx: ContextId) {
    const enhancers = wrapper.getEnhancersMetadata() || [];
    const loadEnhancer = (item: ComponentWrapper) => {
      return this.loadInstance(item, ctx);
    };
    await Promise.all(enhancers.map(loadEnhancer));
  }

  public loadCtorMetadata(metadata: ComponentWrapper<any>[], contextId: ContextId): TaskThenable<any>[] {
    return metadata.map((item) => this.resolveInstance(item, contextId));
  }

  public loadPropertiesMetadata(metadata: PropertyMetadata[], contextId: ContextId): PropertyDependencyLoadTask[] {
    return metadata.map(({ wrapper: item, key }) => {
      const instanceRst = this.resolveInstance(item, contextId);

      return {
        key,
        name: key,
        isResolved: false,
        loadTask: instanceRst,
        instance: null,
      };
    });
  }
}
