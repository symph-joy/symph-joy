import {
  OPTIONAL_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
  PARAMTYPES_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from "../constants";
import { Scope, Type } from "../interfaces";
import {
  isFunction,
  isNil,
  isObject,
  isPromise,
  isSubClass,
  isUndefined,
} from "../utils/shared.utils";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { UndefinedDependencyException } from "../errors/exceptions/undefined-dependency.exception";
import { UnknownDependenciesException } from "../errors/exceptions/unknown-dependencies.exception";
import { STATIC_CONTEXT } from "./constants";
import {
  ContextId,
  IInstanceWrapper,
  InstancePerContext,
  InstanceWrapper,
  PropertyMetadata,
} from "./instance-wrapper";
import { TaskThenable, ThenableResult } from "../utils/task-thenable";
import {
  EnuInjectBy,
  IInjectableDependency,
} from "../interfaces/injectable-dependency.interface";
import { JoyContainer } from "./joy-container";
import { providerNameGenerate } from "./provider-name-generate";
import { getInjectableMeta } from "../decorators/core";
import { isProviderInfoWareProvider } from "../interfaces/context/provider-info-ware.interface";
import { InvalidDependencyTypeException } from "../errors/exceptions/invalid-dependency-type.exception";
import { HookCenter, HookPipe } from "../hook/hook-center";
import { HookType } from "../hook/interface/hook.interface";
import { NotUniqueMatchedProviderException } from "../errors/exceptions/not-unique-matched-provider.exception";
import { InjectCustomOptionsInterface } from "../interfaces/inject-custom-options.interface";
// const SyncThenable = Promise
// type SyncThenable<T> = Promise<T>
/**
 * The type of an injectable dependency
 */
export type InjectorDependency =
  | Type<any>
  | string
  | InjectCustomOptionsInterface;

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
  name?: string;
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
  injectorAfterPropertiesSet<T>(
    instance: T,
    args: { instanceWrapper: IInstanceWrapper }
  ): T;
}

export class Injector {
  private afterPropertiesSetHook: HookPipe;

  constructor(private pluginCenter: HookCenter) {
    this.afterPropertiesSetHook = this.pluginCenter.registerHook({
      id: "injectorAfterPropertiesSet",
      async: false,
      parallel: false,
      type: HookType.Waterfall,
    });
  }

  public loadProvider<T>(
    wrapper: InstanceWrapper<T>,
    container: JoyContainer,
    contextId = STATIC_CONTEXT
  ): ThenableResult<T> {
    const instance = this.loadInstance<T>(wrapper, container, contextId);
    // await this.loadEnhancersPerContext(wrapper, contextId, wrapper
    return instance.getResult();
  }

  public loadInstance<T>(
    wrapper: InstanceWrapper<T>,
    container: JoyContainer,
    contextId = STATIC_CONTEXT
  ): TaskThenable<T> {
    const instanceHost = wrapper.getInstanceByContextId(contextId);
    if (instanceHost.isResolved) {
      return TaskThenable.resolve(instanceHost.instance);
    }

    if (wrapper.scope === Scope.DEFAULT && instanceHost.loadTask) {
      return instanceHost.loadTask;
    }

    const { name, inject } = wrapper;
    const targetWrapper = wrapper;
    if (isUndefined(targetWrapper)) {
      throw new RuntimeException();
    }

    const constructorDeps = this.resolveConstructorParams<T>(
      wrapper,
      container,
      inject,
      contextId
    );

    const loadTask = TaskThenable.all(constructorDeps)
      .then((deps: any[]) => {
        return this.instantiateClass(
          container,
          deps,
          instanceHost,
          wrapper,
          targetWrapper,
          contextId
        );
      })
      .then((instance: unknown) => {
        if (!isNil(inject)) {
          return instance;
        }
        return this.loadInstanceProperties(
          instance,
          wrapper,
          container,
          contextId
        ).then((injectedProps: unknown[]) => {
          return instance;
        });
      })
      .then((instance: any) => {
        if (isProviderInfoWareProvider(instance)) {
          instance.setProviderInfo({
            name: wrapper.name,
            type: wrapper.type,
            scope: wrapper.scope!,
          });
        }
        if (isFunction(instance.afterPropertiesSet)) {
          const rst = instance.afterPropertiesSet();
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
        instanceHost.isResolved = true;

        instance = this.afterPropertiesSetHook.call(instance, {
          instanceWrapper: wrapper,
        });
        return instance;
      });

    instanceHost.loadTask = loadTask;

    return loadTask;
  }

  public loadInstanceProperties<T>(
    instance: unknown,
    wrapper: InstanceWrapper<T>,
    container: JoyContainer,
    contextId = STATIC_CONTEXT
  ): TaskThenable<IInjectableDependency[]> {
    const properties = this.resolveProperties(
      wrapper,
      container,
      contextId,
      wrapper
    );
    if (properties.length === 0) {
      return TaskThenable.resolve([]);
    }
    return TaskThenable.all(properties.map((i) => i.loadTask)).then(
      (propertyInstances: any) => {
        properties.forEach((p, i) => {
          p.isResolved = true;
          p.instance = propertyInstances[i];
        });
        this.applyProperties(instance, properties);
        return properties;
      }
    );
  }

  public resolveConstructorParams<T>(
    wrapper: InstanceWrapper<T>,
    container: JoyContainer,
    inject: InjectorDependency[] | undefined,
    contextId = STATIC_CONTEXT
  ): (TaskThenable | undefined)[] {
    const metadata = wrapper.getCtorMetadata();
    if (metadata) {
      return this.loadCtorMetadata(container, metadata, contextId);
    }
    const dependencies = this.reflectConstructorParams(
      wrapper.type as Type<any>,
      inject
    );
    const optionalDependenciesIds = isNil(inject)
      ? this.reflectOptionalParams(wrapper.type as Type<any>)
      : [];

    return dependencies.map((param, index) => {
      try {
        return this.resolveSingleParam<T>(wrapper, param, container, contextId);
      } catch (err) {
        const isOptional =
          param.isOptional ||
          (optionalDependenciesIds && optionalDependenciesIds.includes(index));
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
  public reflectConstructorParams<T>(
    type: Type<T>,
    params: InjectorDependency[] | undefined
  ): IInjectableDependency[] {
    let paramDeps: IInjectableDependency[] = [];
    // when useFactory or custom inject constructor params
    if (!isNil(params)) {
      paramDeps = params.map(
        (param, index): IInjectableDependency => {
          let type: Type | undefined;
          let name: string | undefined;
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
        }
      );
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

    const custructionParams =
      Reflect.getMetadata(PARAMTYPES_METADATA, type) || [];
    paramDeps = custructionParams.map((paramType: any, index: number) => {
      const cusParam = cusParamsMap && cusParamsMap.get(index);
      if (!isNil(cusParam)) return cusParam;
      if (paramType === Object) {
        //when not specified a type, or set as a interface
        throw new UndefinedDependencyException(
          `constructor argument(index:${index})`,
          {
            index: index,
            dependencies: custructionParams,
          }
        );
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

  public resolveSingleParam<T>(
    wrapper: InstanceWrapper<T>,
    dependency: IInjectableDependency,
    container: JoyContainer,
    contextId = STATIC_CONTEXT,
    inquirer?: InstanceWrapper
  ): TaskThenable<unknown> {
    if (isUndefined(dependency)) {
      throw new UndefinedDependencyException(wrapper.name, dependency);
    }
    const { key, index, designType, name, type, injectBy } = dependency;

    if (injectBy === EnuInjectBy.TYPE && type === Object) {
      throw new InvalidDependencyTypeException(
        wrapper.name,
        index,
        undefined,
        `should not set Object type to ${wrapper.name} argument at index [${index}]`
      );
    }

    let instanceWrapper = this.getInstanceWrapper(
      container,
      injectBy,
      type,
      name
    );

    if (isNil(instanceWrapper) && !isNil(dependency.type)) {
      instanceWrapper = this.dynamicAddWrapper(
        container,
        dependency.type,
        dependency.name
      );
    }

    if (isNil(instanceWrapper)) {
      throw new UnknownDependenciesException(wrapper.name, dependency);
    }
    if (
      designType &&
      designType !== Object &&
      instanceWrapper.type !== Object &&
      designType !== instanceWrapper.type &&
      !isSubClass(instanceWrapper.type, designType)
    ) {
      throw new InvalidDependencyTypeException(
        wrapper.name,
        index,
        key,
        `${instanceWrapper.type.name} class provider can not set to ${type?.name} class`
      );
    }

    !isNil(key)
      ? wrapper.addPropertiesMetadata(key, instanceWrapper)
      : wrapper.addCtorMetadata(index!, instanceWrapper);

    return this.resolveInstance(
      container,
      instanceWrapper,
      contextId,
      inquirer
    );
  }

  public getInstanceWrapper(
    container: JoyContainer,
    injectBy: EnuInjectBy.TYPE,
    type: Type,
    name: string | undefined
  ): InstanceWrapper | undefined;

  public getInstanceWrapper(
    container: JoyContainer,
    injectBy: EnuInjectBy.NAME,
    type: Type | undefined,
    name: string
  ): InstanceWrapper | undefined;

  public getInstanceWrapper(
    container: JoyContainer,
    injectBy: EnuInjectBy | undefined,
    type: Type | undefined,
    name: string | undefined
  ): InstanceWrapper | undefined;

  public getInstanceWrapper(
    container: JoyContainer,
    injectBy: EnuInjectBy | undefined,
    type: Type | undefined,
    name: string | undefined
  ): InstanceWrapper | undefined {
    let instanceWrapper;
    if (type === undefined && name === undefined) {
      throw new Error(
        "Can not find provider by type and name, the both are undefined."
      );
    }
    switch (injectBy) {
      case EnuInjectBy.TYPE:
        if (type === undefined) {
          throw new Error(
            "Can not find provider by type, the type is undefined."
          );
        }
        instanceWrapper = container.getProviderByType(type);
        break;
      case EnuInjectBy.NAME:
        if (name === undefined) {
          throw new Error(
            "Can not find provider by name, the name is undefined."
          );
        }
        instanceWrapper = container.getProviderByName(name);
        if (instanceWrapper && !isSubClass(instanceWrapper.type, type)) {
          // todo print warn log, but not interrupt running
        }
        break;
      case EnuInjectBy.TYPE_NAME:
      default:
        let err: Error | undefined;
        if (type !== undefined) {
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
          instanceWrapper = container.getProviderByName(name);
        }
        if (!instanceWrapper && err) {
          throw err;
        }
    }
    return instanceWrapper;
  }

  private dynamicAddWrapper(
    container: JoyContainer,
    type: Type,
    name?: string
  ): InstanceWrapper | undefined {
    const meta = getInjectableMeta(type);
    if (!meta || !meta.autoLoad) {
      return undefined;
    }
    if (name) {
      meta.id = name;
    }
    return container.addProvider(meta);
  }

  public resolveParamToken<T>(
    wrapper: InstanceWrapper<T>,
    param: Type<any> | string | symbol | any
  ) {
    if (!param.forwardRef) {
      return param;
    }
    wrapper.forwardRef = true;
    return param.forwardRef();
  }

  public resolveInstance<T>(
    container: JoyContainer,
    instanceWrapper: InstanceWrapper<T>,
    contextId = STATIC_CONTEXT,
    inquirer?: InstanceWrapper
  ): TaskThenable<T> {
    return this.loadInstance(instanceWrapper, container, contextId);
  }

  public resolveProperties<T>(
    wrapper: InstanceWrapper<T>,
    container: JoyContainer,
    contextId = STATIC_CONTEXT,
    inquirer?: InstanceWrapper
  ): PropertyDependencyLoadTask[] {
    const metadata = wrapper.getPropertiesMetadata();
    if (metadata) {
      return this.loadPropertiesMetadata(container, metadata, contextId);
    }
    const properties = this.reflectProperties(wrapper.type as Type<any>);

    return properties.map((propDep) => {
      let instanceRst;
      try {
        instanceRst = this.resolveSingleParam<T>(
          wrapper,
          propDep,
          container,
          contextId,
          inquirer
        );
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
    const optionalKeys: string[] =
      Reflect.getMetadata(OPTIONAL_PROPERTY_DEPS_METADATA, type) || [];

    return properties.map((item: any) => ({
      ...item,
      isOptional: optionalKeys.includes(item.key),
      isResolved: false,
    }));
  }

  public applyProperties<T = unknown>(
    instance: T,
    properties: IInjectableDependency[]
  ): void {
    if (isObject(instance)) {
      properties
        .filter((item) => !isNil(item.instance))
        .forEach((item) => ((instance as any)[item.key!] = item.instance));
    }
  }

  public instantiateClass<T = any>(
    container: JoyContainer,
    instances: any[],
    instanceHost: InstancePerContext<T>,
    wrapper: InstanceWrapper,
    targetMetatype: InstanceWrapper,
    contextId = STATIC_CONTEXT
  ): TaskThenable<T> | T {
    const { type, inject } = wrapper;

    if (isNil(inject)) {
      // instance by constructor
      instanceHost.instance = wrapper.forwardRef
        ? Object.assign(
            instanceHost.instance,
            new (type as Type<any>)(...instances)
          )
        : new (type as Type<any>)(...instances);
      return instanceHost.instance!;
    } else {
      const factory = targetMetatype.factory!;
      if (typeof factory === "object") {
        // instance by configuration
        const { factory: factoryClass, property } = factory;
        const factoryWrapper = container.getProviderByType(factoryClass);
        if (isNil(factoryWrapper)) {
          throw new RuntimeException(
            `Instantiate factory provider failed, can not find factory instance(class: ${factoryClass.name}) in container.`
          );
        }
        return this.resolveInstance(container, factoryWrapper!, contextId).then(
          (factoryInstance) => {
            const returnValue = factoryInstance[property](...instances);
            instanceHost.instance = returnValue;
            return returnValue;
          }
        );
      } else {
        // instance by factory function
        const returnValue = factory(...instances);
        instanceHost.instance = returnValue;
        return returnValue;
      }
    }
  }

  public async loadEnhancersPerContext(
    wrapper: InstanceWrapper,
    container: JoyContainer,
    ctx: ContextId
  ) {
    const enhancers = wrapper.getEnhancersMetadata() || [];
    const loadEnhancer = (item: InstanceWrapper) => {
      return this.loadInstance(
        item,
        // hostModule.injectables,
        container,
        ctx
      );
    };
    await Promise.all(enhancers.map(loadEnhancer));
  }

  public loadCtorMetadata(
    container: JoyContainer,
    metadata: InstanceWrapper<any>[],
    contextId: ContextId
  ): TaskThenable<any>[] {
    return metadata.map((item) =>
      this.resolveInstance(container, item, contextId)
    );
  }

  public loadPropertiesMetadata(
    container: JoyContainer,
    metadata: PropertyMetadata[],
    contextId: ContextId
  ): PropertyDependencyLoadTask[] {
    return metadata.map(({ wrapper: item, key }) => {
      const instanceRst = this.resolveInstance(container, item, contextId);

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
