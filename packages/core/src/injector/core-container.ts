import { Abstract, ClassProvider, FactoryProvider, IInjectable, Provider, TProviderName, Type, ValueProvider } from "../interfaces";
import { isEmpty, isNil, isSubClass, isUndefined } from "../utils/shared.utils";
import { ComponentWrapper, ComponentWrapperOptions } from "./component-wrapper";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { AutowireHook, HookType, IHook } from "../hook";
import { NotUniqueMatchedProviderException } from "../errors/exceptions/not-unique-matched-provider.exception";

// type TProviderName = string;

interface ProviderName {
  name?: string | symbol;
}

interface ProviderIndex {
  touchIndex(indexKey: string): void;

  get(indexKey: string): TProviderName[];

  add(indexKey: string, providerId: TProviderName): void;

  remove(indexKey: string, providerId: TProviderName): void;
}

export class CoreContainer {
  // private readonly _providers = new Map<string, ComponentWrapper<Injectable>>()

  @AutowireHook({ type: HookType.Traverse, async: false })
  public onComponentRegisterAfter: IHook;

  @AutowireHook({ type: HookType.Traverse, async: false })
  public onComponentReplaceAfter: IHook;

  private readonly _providerStore = new Map<string, ComponentWrapper>();

  private readonly _typeMap = new Map<Type | Abstract, Map<Type | Abstract, string[]>>();
  private readonly _nameMap = new Map<TProviderName, string[]>(); // key: component.name, value: component.id
  private readonly _aliasMap = new Map<TProviderName, TProviderName>(); // key: aliasName, value: component.name

  // /**
  //  * 可使用已存在Component的情况：已存在的同名的，且类型兼容，scope相等。
  //  * 所欲其它情况，直接使用新的Component定义，替换旧的Component。
  //  *
  //  * @param wrapperMetaOptions
  //  * @private
  //  */
  // private checkWrapperReplaceable(wrapperMetaOptions: ComponentWrapperOptions): ComponentWrapper | undefined {
  //   const {type, name, scope} = wrapperMetaOptions;
  //   if (!name) {
  //     return;
  //   }
  //   const exist = this.getProviderByName(name);
  //   if (exist) {
  //     if (exist.hasInstanced) {
  //       if (!(exist.type === type || isSubClass(exist.type, type)) || exist.scope !== scope) {
  //         throw new RuntimeException(`Register provider failed, can not register duplicate name(${String(name)}), the previous register one has instanced, and the type and scope is not compatible。`);
  //       }
  //     }
  //   }
  //
  //   return exist;
  // }

  public addWrapper(wrapperMetaOptions: ComponentWrapperOptions): ComponentWrapper {
    const { type, name, package: compPackage, alias, scope } = wrapperMetaOptions;
    if (!name) {
      throw new RuntimeException(`Register provider failed, the name is undefined.`);
    }
    let mergedAlias = alias;
    const existOne = this.getProviderByName(name, compPackage);
    if (existOne) {
      if (existOne.hasInstanced) {
        if (!(existOne.type === type || isSubClass(existOne.type, type)) || existOne.scope !== scope) {
          throw new RuntimeException(`Register provider failed, can not register duplicate name(${String(name)}), the previous register one has instanced, and the type and scope is not compatible。`);
        } else {
          return existOne;
        }
      }
      if (existOne.alias && existOne.alias.length >= 0) {
        mergedAlias = mergedAlias?.concat(existOne.alias);
      }
    }

    let componentWrapper = new ComponentWrapper({ ...wrapperMetaOptions });
    if (existOne) {
      console.debug(`Overriding component (name: ${String(name)}, package: ${compPackage || ""}): replacing {type:${existOne.type?.name}} with {type:${componentWrapper.type?.name}}"`);
    }
    this._providerStore.set(componentWrapper.id, componentWrapper);
    this.addNameCache(componentWrapper);
    this.addTypeCache(componentWrapper);
    if (alias && alias.length) {
      for (const it of alias) {
        const existAlias = this._aliasMap.get(it);
        if (existAlias) {
          if (existAlias !== name) {
            console.debug(`Overriding alias '${String(it)}' definition for registered name ${String(existAlias)} with new target name '${String(name)}'`);
          } else {
            // has not changed
            continue;
          }
        }
        this._aliasMap.set(it, name);
      }
    }
    if (this.onComponentRegisterAfter) {
      this.onComponentRegisterAfter.call(componentWrapper);
    }

    return componentWrapper;
  }

  public deleteWrapper(instanceWrapper: ComponentWrapper<IInjectable>) {
    this.deleteCache(instanceWrapper);
    this._providerStore.delete(instanceWrapper.id);
  }

  private addNameCache(instanceWrapper: ComponentWrapper<IInjectable>): void {
    const { id, name } = instanceWrapper;
    const ids = this._nameMap.get(name) || [];
    ids.push(id);
    this._nameMap.set(name, ids);
  }

  private addTypeCache(instanceWrapper: ComponentWrapper<IInjectable>): void {
    const { type, name, id } = instanceWrapper;
    if (!type) {
      throw new RuntimeException(`Provider's type must not be null. provider name:${name.toString()}`);
    }
    let proto = type;
    let ids: string[] = this._typeMap.get(type)?.get(type) || [];
    if (!ids) {
      ids = [id];
    } else {
      ids.push(id);
    }
    do {
      let typeCache = this._typeMap.get(proto);
      if (!typeCache) {
        typeCache = new Map<Type | Abstract, string[]>([[type, ids]]);
        this._typeMap.set(proto, typeCache);
      } else {
        typeCache.set(type, ids);
      }
      proto = Object.getPrototypeOf(proto);
    } while (proto !== Function.prototype);
  }

  private deleteCache(instanceWrapper: ComponentWrapper<IInjectable>): boolean {
    let hasDel = false;
    const { type, name } = instanceWrapper;
    const names = Array.isArray(name) ? name : [name];
    for (const n of names) {
      hasDel = this._nameMap.delete(n) || hasDel;
    }

    if (!type) {
      return hasDel;
    }
    const typeCache = this._typeMap.get(type);
    if (!typeCache) {
      return hasDel;
    }
    if (typeCache.size >= 0) {
      this._typeMap.delete(type);
      hasDel = true;
    }
    return hasDel;
  }

  public addProviders(providers: Provider[]): ComponentWrapper[] {
    const instanceWrappers = new Array<ComponentWrapper>(providers?.length || 0);
    if (!providers || providers.length === 0) {
      return instanceWrappers;
    }
    return providers.map((provider) => this.addProvider(provider));
  }

  public getProviderDefinition<T = unknown>(nameOrType: string | Type<T> | Abstract<T>): Provider | undefined {
    const wrapper = this.getProvider<T>(nameOrType);
    if (!wrapper) {
      return undefined;
    }
    return this.getProviderDefinitionByWrapper(wrapper);
  }

  private getProviderDefinitionByWrapper<T = unknown>(wrapper: ComponentWrapper<T>): Provider<T> {
    let definition: Provider<T>;
    const { instanceBy, name, type, scope } = wrapper;
    if (instanceBy === "class") {
      definition = {
        name: name,
        useClass: type,
        scope,
        lazyRegister: wrapper.autoLoad,
      } as ClassProvider<T>;
    } else if (instanceBy === "value") {
      definition = {
        name: name,
        type,
        useValue: wrapper.instance,
      } as ValueProvider<T>;
    } else if (instanceBy === "factory") {
      definition = {
        name: name,
        type,
        useFactory: wrapper.factory,
        inject: wrapper.inject,
        scope: scope,
      } as FactoryProvider<T>;
    } else {
      throw new Error(`unknown instanceBy, wrapper:${wrapper.id}`);
    }
    return definition;
  }

  public addProvider(provider: Provider): ComponentWrapper {
    let instanceWrapper: ComponentWrapper;
    if (this.isCustomClass(provider)) {
      instanceWrapper = this.addCustomClass(provider);
    } else if (this.isCustomValue(provider)) {
      instanceWrapper = this.addCustomValue(provider);
    } else if (this.isCustomFactory(provider)) {
      instanceWrapper = this.addCustomFactory(provider);
    } else {
      throw new RuntimeException(`unknown provider type${provider}`);
    }
    return instanceWrapper;
  }

  public isCustomProvider(provider: Provider): provider is ClassProvider | FactoryProvider | ValueProvider {
    return !isNil((provider as ClassProvider | FactoryProvider | ValueProvider).name);
  }

  public isCustomClass(provider: any): provider is ClassProvider {
    return !isUndefined((provider as ClassProvider).useClass);
  }

  public isCustomValue(provider: any): provider is ValueProvider {
    return !isUndefined((provider as ValueProvider).useValue);
  }

  public isCustomFactory(provider: any): provider is FactoryProvider {
    return !isUndefined((provider as FactoryProvider).useFactory);
  }

  public addCustomClass(provider: ClassProvider): ComponentWrapper {
    const { name, package: packageName, global, alias, type, useClass, scope } = provider;
    return this.addWrapper({
      instanceBy: "class",
      name,
      alias,
      package: packageName,
      global: global,
      type: useClass,
      useClass: useClass || type,
      instance: null,
      isResolved: false,
      scope,
    });
  }

  public addCustomValue(provider: ValueProvider): ComponentWrapper {
    const { name, alias, useValue: value, type = Object } = provider;
    return this.addWrapper({
      instanceBy: "value",
      name,
      alias,
      type,
      instance: value,
      isResolved: true,
      async: value instanceof Promise,
    });
  }

  public addCustomFactory(provider: FactoryProvider): ComponentWrapper {
    const { name, alias, useFactory: factory, inject, scope, type } = provider;
    return this.addWrapper({
      instanceBy: "factory",
      name,
      alias,
      type: type,
      factory,
      inject: inject || [],
      instance: null,
      isResolved: false,
      scope,
    });
  }

  public replace(toReplaceWrapperId: string, newProvider: Partial<Provider>) {
    const provider = this.getProviderById(toReplaceWrapperId);
    if (!provider) {
      throw new RuntimeException("cannot merge provider, originalProvider id${}");
    }
    const beforeDefinition = this.getProviderDefinitionByWrapper(provider);
    provider.replaceWith(newProvider);
    const nextDefinition = this.getProviderDefinitionByWrapper(provider);
    this.onComponentReplaceAfter.call(nextDefinition, beforeDefinition);
  }

  public delete<T = unknown>(idOrType: string | Type<T> | Abstract<T>) {
    const provider = this.getProvider<T>(idOrType);
    if (!provider) {
      throw new RuntimeException(`cannot remove provider(${idOrType}), it is not exists in container.`);
    }
    this.deleteWrapper(provider);
    return provider;
  }

  public hasModule(moduleName: string) {
    return !isEmpty(this._providerStore.get(moduleName));
  }

  public getProvider<T = unknown>(nameOrType: TProviderName | Type<T> | Abstract<T>, packageName?: string): ComponentWrapper<T> | undefined {
    if (typeof nameOrType === "string" || typeof nameOrType === "symbol") {
      return this.getProviderByName(nameOrType, packageName) as ComponentWrapper<T>;
    } else {
      return this.getProviderByType(nameOrType);
    }
  }

  public getProviderIds(): Iterable<string> {
    return this._providerStore.keys();
  }

  public getProviderById<T = any>(id: string): ComponentWrapper<T> | undefined {
    return this._providerStore.get(id);
  }

  /**
   * 按名称查找组件策略：
   * 1. 在包内查找。
   * 2. 在全局公共包中查找。
   * @param name
   * @param packageName
   */
  public getProviderByName<T = any>(name: TProviderName, packageName?: string): ComponentWrapper<T> | undefined {
    let id = this._nameMap.get(name);
    if (!id || id.length === 0) {
      const targetName = this._aliasMap.get(name);
      if (targetName) {
        id = this._nameMap.get(targetName);
        if (!id) {
          console.debug(`Component alias '${String(name)}' can not find target name '${String(targetName)}' definition.`);
          return undefined;
        }
      }
    }
    if (id && id.length > 0) {
      if (packageName) {
        for (let i = id.length - 1; i >= 0; i--) {
          const wrapper = this._providerStore.get(id[i]);
          if (wrapper && wrapper.package === packageName) {
            return this._providerStore.get(id[i]);
          }
        }
      }
      for (let i = id.length - 1; i >= 0; i--) {
        const wrapper = this._providerStore.get(id[i]);
        if (wrapper && (!wrapper.package || wrapper.global)) {
          return this._providerStore.get(id[i]);
        }
      }
    }

    return undefined;
  }

  public getProviderByType<T = any>(type: Type | Abstract): ComponentWrapper | undefined {
    const matchTypes = this._typeMap.get(type);
    if (!matchTypes) {
      return undefined;
    }
    const matchSize = matchTypes.size;
    if (matchSize === 1) {
      const onlyMatchIds: string[] = matchTypes.values().next().value;
      // The last register one will replace previous.
      return this._providerStore.get(onlyMatchIds[onlyMatchIds.length - 1]);
    } else if (matchSize > 1) {
      const exactMatched = matchTypes.get(type);
      if (exactMatched && exactMatched.length === 1) {
        return this._providerStore.get(exactMatched[0]);
      } else {
        // throw new Error(`There is ${matchSize} providers match the type(${type.name})`)
        throw new NotUniqueMatchedProviderException(
          type,
          [...matchTypes.keys()].map((it) => it.name)
        );
      }
    }
    return undefined;
  }

  public getProvidersByType<T = any>(type: Type | Abstract): string[] {
    const matchTypes = this._typeMap.get(type);
    if (!matchTypes) {
      return [];
    }
    let ids = [] as string[];
    for (const _ids of matchTypes.values()) {
      ids = ids.concat(_ids);
    }
    return ids;
  }

  public filter<T = unknown>(filter: (wrapper: ComponentWrapper) => boolean): ComponentWrapper<T>[] {
    const internalProviderIds = this._providerStore.keys();
    const result = new Array<ComponentWrapper<T>>();
    for (const providerId of internalProviderIds) {
      const wrapper = this._providerStore.get(providerId);
      if (wrapper && filter(wrapper)) {
        result.push(wrapper);
      }
    }
    return result;
  }
}
