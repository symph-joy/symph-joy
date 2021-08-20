import { Abstract, ClassProvider, FactoryProvider, IInjectable, Provider, TProviderName, Type, ValueProvider } from "../interfaces";
import { isEmpty, isNil, isUndefined } from "../utils/shared.utils";
import { ComponentWrapper } from "./component-wrapper";
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
  public onRegisterProviderAfter: IHook;

  @AutowireHook({ type: HookType.Traverse, async: false })
  public onReplaceProviderAfter: IHook;

  private readonly _providerStore = new Map<string, ComponentWrapper>();

  private readonly _typeCache = new Map<Type | Abstract, Map<Type | Abstract, string[]>>();
  private readonly _nameCache = new Map<TProviderName | Abstract, string>();

  private checkWrapperReplaceable(instanceWrapper: ComponentWrapper): void {
    let exist;
    for (const n of instanceWrapper.name) {
      exist = this.getProviderByName(n);
      if (exist && exist.hasInstanced) {
        throw new RuntimeException(`Can not register duplicate provider, the previous register name(${String(n)}) one has instanced. provider type:${instanceWrapper.type.name}`);
      }
    }
  }

  public addWrapper(instanceWrapper: ComponentWrapper<IInjectable>): ComponentWrapper {
    this.checkWrapperReplaceable(instanceWrapper);

    this._providerStore.set(instanceWrapper.id, instanceWrapper);
    this.addCache(instanceWrapper);
    return instanceWrapper;
  }

  public deleteWrapper(instanceWrapper: ComponentWrapper<IInjectable>) {
    this.deleteCache(instanceWrapper);
    this._providerStore.delete(instanceWrapper.id);
  }

  private addCache(instanceWrapper: ComponentWrapper<IInjectable>): void {
    this.addNameCache(instanceWrapper);
    this.addTypeCache(instanceWrapper);
  }

  private addNameCache(instanceWrapper: ComponentWrapper<IInjectable>): void {
    const { id, name } = instanceWrapper;
    if (Array.isArray(name)) {
      for (const n of name) {
        this._nameCache.set(n, id);
      }
    } else {
      this._nameCache.set(name, id);
    }
  }

  private addTypeCache(instanceWrapper: ComponentWrapper<IInjectable>): void {
    const { type, name, id } = instanceWrapper;
    if (!type) {
      throw new RuntimeException(`Provider's type must not be null. provider name:${name.toString()}`);
    }
    let proto = type;
    let ids: string[] = this._typeCache.get(type)?.get(type) || [];
    if (!ids) {
      ids = [id];
    } else {
      ids.push(id);
    }
    do {
      let typeCache = this._typeCache.get(proto);
      if (!typeCache) {
        typeCache = new Map<Type | Abstract, string[]>([[type, ids]]);
        this._typeCache.set(proto, typeCache);
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
      hasDel = this._nameCache.delete(n) || hasDel;
    }

    if (!type) {
      return hasDel;
    }
    const typeCache = this._typeCache.get(type);
    if (!typeCache) {
      return hasDel;
    }
    if (typeCache.size >= 0) {
      this._typeCache.delete(type);
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
        autoLoad: wrapper.autoLoad,
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
    this.onRegisterProviderAfter.call(provider, instanceWrapper);
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
    const { name, type, useClass, scope } = provider;
    const names = Array.isArray(name) ? name : [name];
    return this.addWrapper(
      new ComponentWrapper({
        instanceBy: "class",
        name: names,
        type: useClass,
        useClass: useClass || type,
        instance: null,
        isResolved: false,
        scope,
      })
    );
  }

  public addCustomValue(provider: ValueProvider): ComponentWrapper {
    const { name, useValue: value, type = Object } = provider;
    const names = Array.isArray(name) ? name : [name];
    return this.addWrapper(
      new ComponentWrapper({
        instanceBy: "value",
        name: names,
        type,
        instance: value,
        isResolved: true,
        async: value instanceof Promise,
      })
    );
  }

  public addCustomFactory(provider: FactoryProvider): ComponentWrapper {
    const { name, useFactory: factory, inject, scope, type } = provider;
    const names = Array.isArray(name) ? name : [name];
    return this.addWrapper(
      new ComponentWrapper({
        instanceBy: "factory",
        name: names,
        type: type,
        factory,
        inject: inject || [],
        instance: null,
        isResolved: false,
        scope,
      })
    );
  }

  public replace(toReplace: string, newProvider: Partial<Provider>) {
    const provider = this.getProviderByName(toReplace);
    if (!provider) {
      throw new RuntimeException("cannot merge provider, originalProvider id${}");
    }
    const beforeDefinition = this.getProviderDefinitionByWrapper(provider);
    provider.replaceWith(newProvider);
    const nextDefinition = this.getProviderDefinitionByWrapper(provider);
    this.onReplaceProviderAfter.call(nextDefinition, beforeDefinition);
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

  public getProvider<T = unknown>(nameOrType: TProviderName | Type<T> | Abstract<T>): ComponentWrapper<T> | undefined {
    if (typeof nameOrType === "string" || typeof nameOrType === "symbol") {
      return this.getProviderByName(nameOrType) as ComponentWrapper<T>;
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

  public getProviderByName<T = any>(name: TProviderName): ComponentWrapper<T> | undefined {
    const id = this._nameCache.get(name);
    if (id) {
      return this._providerStore.get(id);
    }
    return undefined;
  }

  public getProviderByType<T = any>(type: Type | Abstract): ComponentWrapper | undefined {
    const matchTypes = this._typeCache.get(type);
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
    const matchTypes = this._typeCache.get(type);
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
