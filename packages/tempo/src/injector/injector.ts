import {
  OPTIONAL_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
  PARAMTYPES_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from "../constants";
import { Type } from "../interfaces";
import {
  isFunction,
  isNil,
  isObject,
  isSubClass,
  isUndefined,
} from "../utils/shared.utils";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { UndefinedDependencyException } from "../errors/exceptions/undefined-dependency.exception";
import { UnknownDependenciesException } from "../errors/exceptions/unknown-dependencies.exception";
import { STATIC_CONTEXT } from "./constants";
import {
  ContextId,
  InstancePerContext,
  InstanceWrapper,
  PropertyMetadata,
} from "./instance-wrapper";
import { TaskThenable, ThenableResult } from "../utils/task-thenable";
import { Dependency, EnuInjectBy } from "../interfaces/dependency.interface";
import { JoyContainer } from "./joy-container";
import { providerNameGenerate } from "./provider-name-generator";
import { getInjectableMeta } from "../decorators/core";
import { isProviderInfoWareProvider } from "../interfaces/context/provider-info-ware.interface";
import { InvalidDependencyTypeException } from "../errors/exceptions/invalid-dependency-type.exception";
// const SyncThenable = Promise
// type SyncThenable<T> = Promise<T>
/**
 * The type of an injectable dependency
 */
export type InjectorDependency = Type<any> | string;

/**
 * load property-based dependency
 */
interface PropertyDependencyLoadTask extends Dependency {
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

export class Injector {
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

    if (instanceHost.loadTask) {
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
      contextId,
      wrapper
    );

    const loadTask = TaskThenable.all(constructorDeps)
      .then((deps) => {
        return this.instantiateClass(
          deps,
          instanceHost,
          wrapper,
          targetWrapper,
          contextId
        );
      })
      .then((instance) => {
        if (!isNil(inject)) {
          return instance;
        }
        return this.loadInstanceProperties(
          instance,
          wrapper,
          container,
          contextId
        ).then((injectedProps) => {
          return instance;
        });
      })
      .then((instance) => {
        if (isProviderInfoWareProvider(instance)) {
          instance.setProviderInfo({
            name: wrapper.name,
            type: wrapper.type,
            scope: wrapper.scope,
          });
        }

        if (isFunction(instance.afterPropertiesSet)) {
          instance.afterPropertiesSet();
        }
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
  ): TaskThenable<Dependency[]> {
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
      (propertyInstances) => {
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
    contextId = STATIC_CONTEXT,
    inquirer?: InstanceWrapper
  ): TaskThenable[] {
    const metadata = wrapper.getCtorMetadata();
    if (metadata) {
      return this.loadCtorMetadata(container, metadata, contextId, inquirer);
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
        return this.resolveSingleParam<T>(
          wrapper,
          param,
          container,
          contextId,
          inquirer
        );
      } catch (err) {
        const isOptional =
          optionalDependenciesIds && optionalDependenciesIds.includes(index);
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
  ): Dependency[] {
    let paramDeps: Dependency[] = [];
    // when useFactory or custom inject constructor params
    if (!isNil(params)) {
      paramDeps = params.map(
        (param, index): Dependency => {
          const designType = isFunction(param) ? (param as Type) : undefined;
          return {
            index,
            name: isFunction(param)
              ? providerNameGenerate(param)
              : (param as string),
            type: designType,
            designType,
            injectBy: isFunction(param) ? EnuInjectBy.TYPE : EnuInjectBy.NAME,
          };
        }
      );
      return paramDeps;
    }
    const cusParams = this.reflectCustomfParams<T>(type); // items that decorated by @Inject()
    let cusParamsMap: Map<number, Dependency>;
    if (cusParams && cusParams.length > 0) {
      cusParamsMap = new Map<number, Dependency>();
      for (const param of cusParams) {
        cusParamsMap.set(param.index, param);
      }
    }

    const custructionParams =
      Reflect.getMetadata(PARAMTYPES_METADATA, type) || [];
    paramDeps = custructionParams.map((paramType, index) => {
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
      } as Dependency;
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
  public reflectCustomfParams<T>(type: Type<T>): Dependency[] {
    return Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, type) || [];
  }

  public resolveSingleParam<T>(
    wrapper: InstanceWrapper<T>,
    dependency: Dependency,
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
        null,
        `should not set Object type to ${wrapper.name} argument at index [${index}]`
      );
    }

    let instanceWrapper = this.getInstanceWrapper(
      container,
      type,
      name,
      injectBy
    );

    if (isNil(instanceWrapper) && !isNil(dependency.type)) {
      instanceWrapper = this.dynamicAddWrapper(
        container,
        dependency.name,
        dependency.type
      );
    }

    if (isNil(instanceWrapper)) {
      throw new UnknownDependenciesException(wrapper.name, dependency);
    }
    if (
      designType &&
      designType !== Object &&
      designType !== instanceWrapper.type &&
      !isSubClass(instanceWrapper.type, designType)
    ) {
      throw new InvalidDependencyTypeException(
        wrapper.name,
        index,
        key,
        `${instanceWrapper.type.name} class provider can not set to ${type.name} class`
      );
    }

    !isNil(key)
      ? wrapper.addPropertiesMetadata(key, instanceWrapper)
      : wrapper.addCtorMetadata(index, instanceWrapper);

    return this.resolveInstance(
      container,
      instanceWrapper,
      contextId,
      inquirer
    );
  }

  public getInstanceWrapper(
    container: JoyContainer,
    type: Type,
    name: string,
    injectBy: EnuInjectBy
  ): InstanceWrapper | undefined {
    let instanceWrapper;
    switch (injectBy) {
      case EnuInjectBy.TYPE:
        instanceWrapper = container.getProvider(type);
        break;
      case EnuInjectBy.NAME:
        instanceWrapper = container.getProvider(name);
        if (instanceWrapper && !isSubClass(instanceWrapper.type, type)) {
          // todo print warn log, but not interrupt running
        }
        break;
      case EnuInjectBy.TYPE_NAME:
      default:
        instanceWrapper = container.getProvidersByType(type);
        if (!instanceWrapper) {
          // then not found by type, or found out more than one provider
          instanceWrapper = container.getProviderByName(name);
        }
    }
    return instanceWrapper;
  }

  private dynamicAddWrapper(
    container: JoyContainer,
    name: string,
    type: Type
  ): InstanceWrapper | null {
    const meta = getInjectableMeta(type);
    if (!meta || !meta.autoReg) {
      return null;
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
      return this.loadPropertiesMetadata(
        container,
        metadata,
        contextId,
        inquirer
      );
    }
    const properties = this.reflectProperties(wrapper.type as Type<any>);

    return properties.map((propDep) => {
      const instanceRst = this.resolveSingleParam<T>(
        wrapper,
        propDep,
        container,
        contextId,
        inquirer
      );

      return {
        ...propDep,
        isResolved: false,
        loadTask: instanceRst,
        instance: null,
      };
    });
  }

  public reflectProperties<T>(type: Type<T>): Dependency[] {
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
    properties: Dependency[]
  ): void {
    if (isObject(instance)) {
      properties
        .filter((item) => !isNil(item.instance))
        .forEach((item) => ((instance as unknown)[item.key] = item.instance));
    }
  }

  public instantiateClass<T = any>(
    instances: any[],
    instanceHost: InstancePerContext<T>,
    wrapper: InstanceWrapper,
    targetMetatype: InstanceWrapper,
    contextId = STATIC_CONTEXT
  ): Promise<T> | T {
    const { type, inject } = wrapper;

    if (isNil(inject)) {
      instanceHost.instance = wrapper.forwardRef
        ? Object.assign(
            instanceHost.instance,
            new (type as Type<any>)(...instances)
          )
        : new (type as Type<any>)(...instances);
    } else {
      const factoryReturnValue = (targetMetatype.factory as any)(...instances);
      instanceHost.instance = factoryReturnValue;
    }
    instanceHost.isResolved = true;
    return instanceHost.instance;
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
    contextId: ContextId,
    inquirer?: InstanceWrapper
  ): TaskThenable<any>[] {
    return metadata.map((item) =>
      this.resolveInstance(container, item, contextId, inquirer)
    );
  }

  public loadPropertiesMetadata(
    container: JoyContainer,
    metadata: PropertyMetadata[],
    contextId: ContextId,
    inquirer?: InstanceWrapper
  ): PropertyDependencyLoadTask[] {
    return metadata.map(({ wrapper: item, key }) => {
      const instanceRst = this.resolveInstance(
        container,
        item,
        contextId,
        inquirer
      );

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
