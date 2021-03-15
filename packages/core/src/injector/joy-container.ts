import {
  Abstract,
  ClassProvider,
  FactoryProvider,
  IInjectable,
  IProvider,
  Provider,
  Scope,
  Type,
  ValueProvider,
} from "../interfaces";
import { isEmpty, isNil, isString, isUndefined } from "../utils/shared.utils";
import { InstanceWrapper } from "./instance-wrapper";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { Hook, HookPipe, HookType } from "../hook";

type ProviderId = string;

interface ProviderName {
  name?: string | symbol;
}

interface ProviderIndex {
  touchIndex(indexKey: string): void;

  get(indexKey: string): ProviderId[];

  add(indexKey: string, providerId: ProviderId): void;

  remove(indexKey: string, providerId: ProviderId): void;
}

export class JoyContainer {
  // private readonly _providers = new Map<string, InstanceWrapper<Injectable>>()

  @Hook({ type: HookType.Traverse, async: false })
  public onRegisterProviderAfter: HookPipe;

  @Hook({ type: HookType.Traverse, async: false })
  public onReplaceProviderAfter: HookPipe;

  private readonly _providerStore = new Map<
    ProviderId,
    InstanceWrapper<IInjectable>
  >();
  private readonly _typeCache = new Map<
    Type | Abstract,
    Map<Type | Abstract, string[]>
  >();

  public addModuleAsProvider(moduleClz: Type<any>) {
    return this.addWrapper(
      new InstanceWrapper({
        name: moduleClz.name,
        type: moduleClz,
        isResolved: false,
        instance: null,
        scope: Scope.DEFAULT,
      })
    );
  }

  public addWrapper(
    instanceWrapper: InstanceWrapper<IInjectable>
  ): InstanceWrapper {
    this._providerStore.set(instanceWrapper.name, instanceWrapper);
    this.addCache(instanceWrapper);
    return instanceWrapper;
  }

  public deleteWrapper(instanceWrapper: InstanceWrapper<IInjectable>) {
    this.deleteCache(instanceWrapper);
    this._providerStore.delete(instanceWrapper.name);
  }

  private addCache(instanceWrapper: InstanceWrapper<IInjectable>): void {
    const { type, name } = instanceWrapper;
    if (!type) {
      throw new RuntimeException(
        `provider's type, must not be null. provider name:${name}`
      );
    }
    let proto = type;
    let ids: string[] = this._typeCache.get(type)?.get(type) || [];
    if (!ids) {
      ids = [name];
    } else {
      ids.push(name);
    }
    do {
      let typeCache = this._typeCache.get(proto);
      if (!typeCache) {
        typeCache = new Map<Type, string[]>([[type, ids]]);
        this._typeCache.set(proto, typeCache);
      } else {
        typeCache.set(type, ids);
      }
      proto = Object.getPrototypeOf(proto);
    } while (proto !== Function.prototype);
  }

  private deleteCache(instanceWrapper: InstanceWrapper<IInjectable>): boolean {
    const { type, name } = instanceWrapper;
    if (!type) {
      return false;
    }
    const typeCache = this._typeCache.get(type);
    if (!typeCache) {
      return false;
    }
    if (typeCache.size >= 0) {
      this._typeCache.delete(type);
      return true;
    }
    return false;
  }

  public addProviders(providers: Provider[]): InstanceWrapper[] {
    const instanceWrappers = new Array<InstanceWrapper>(providers?.length || 0);
    if (!providers || providers.length === 0) {
      return instanceWrappers;
    }
    return providers.map((provider) => this.addProvider(provider));
  }

  public getProviderDefinition<T = unknown>(
    nameOrType: string | Type<T> | Abstract<T>
  ): Provider | undefined {
    const wrapper = this.getProvider<T>(nameOrType);
    if (!wrapper) {
      return undefined;
    }
    return this.getProviderDefinitionByWrapper(wrapper);
  }

  private getProviderDefinitionByWrapper<T = unknown>(
    wrapper: InstanceWrapper<T>
  ): Provider<T> {
    let definition: Provider<T>;
    const { instanceBy, name, type, scope } = wrapper;
    if (instanceBy === "class") {
      definition = {
        id: name,
        useClass: type,
        scope,
        autoReg: wrapper.autoReg,
      } as ClassProvider<T>;
    } else if (instanceBy === "value") {
      definition = {
        id: name,
        type,
        useValue: wrapper.instance,
      } as ValueProvider<T>;
    } else if (instanceBy === "factory") {
      definition = {
        id: name,
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

  public addProvider(provider: Provider): InstanceWrapper {
    let instanceWrapper: InstanceWrapper;
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

  public isCustomProvider(
    provider: Provider
  ): provider is ClassProvider | FactoryProvider | ValueProvider {
    return !isNil(
      (provider as ClassProvider | FactoryProvider | ValueProvider).id
    );
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

  public addCustomClass(provider: ClassProvider): InstanceWrapper {
    const { id, type, useClass, scope } = provider;
    return this.addWrapper(
      new InstanceWrapper({
        instanceBy: "class",
        name: id,
        type: useClass,
        useClass: useClass || type,
        instance: null,
        isResolved: false,
        scope,
      })
    );
  }

  public addCustomValue(
    provider: ValueProvider & ProviderName
  ): InstanceWrapper {
    const { id, useValue: value, type } = provider;
    return this.addWrapper(
      new InstanceWrapper({
        instanceBy: "value",
        name: id,
        type,
        instance: value,
        isResolved: true,
        async: value instanceof Promise,
      })
    );
  }

  public addCustomFactory(
    provider: FactoryProvider & ProviderName
  ): InstanceWrapper {
    const { id, useFactory: factory, inject, scope, type } = provider;
    return this.addWrapper(
      new InstanceWrapper({
        instanceBy: "factory",
        name: id,
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
      throw new RuntimeException(
        "cannot merge provider, originalProvider id${}"
      );
    }
    const beforeDefinition = this.getProviderDefinitionByWrapper(provider);
    provider.replaceWith(newProvider);
    const nextDefinition = this.getProviderDefinitionByWrapper(provider);
    this.onReplaceProviderAfter.call(nextDefinition, beforeDefinition);
  }

  public delete<T = unknown>(idOrType: string | Type<T> | Abstract<T>) {
    const provider = this.getProvider<T>(idOrType);
    if (!provider) {
      throw new RuntimeException(
        `cannot remove provider(${idOrType}), it is not exists in container.`
      );
    }
    this.deleteWrapper(provider);
    return provider;
  }

  public hasModule(moduleName: string) {
    return !isEmpty(this._providerStore.get(moduleName));
  }

  public getProvider<T = unknown>(
    nameOrType: string | Type<T> | Abstract<T>
  ): InstanceWrapper<T> | undefined {
    if (isString(nameOrType)) {
      return this.getProviderByName(nameOrType) as InstanceWrapper<T>;
    } else {
      return this.getProvidersByType(nameOrType);
    }
  }

  public getProviderNames(): Iterable<string> {
    return this._providerStore.keys();
  }

  public getProviderByName<T = any>(
    name: string
  ): InstanceWrapper<T> | undefined {
    return this._providerStore.get(name) as InstanceWrapper<T>;
  }

  public getProvidersByType<T = any>(
    type: Type | Abstract
  ): InstanceWrapper | undefined {
    const matchTypes = this._typeCache.get(type);
    if (!matchTypes) {
      return undefined;
    }
    const matchSize = matchTypes.size;
    if (matchSize === 1) {
      const onlyMatchIds: string[] = matchTypes.values().next().value;
      if (onlyMatchIds && onlyMatchIds.length === 1) {
        return this.getProviderByName(onlyMatchIds[0]);
      }
    } else if (matchSize > 1) {
      const exactMatched = matchTypes.get(type);
      if (exactMatched && exactMatched.length === 1) {
        return this.getProviderByName(exactMatched[0]);
      }
    }
    return undefined;
  }

  // public findInstanceByToken<TInput = any, TResult = TInput>(
  //   typeOrToken: Type<TInput> | Abstract<TInput> | string,
  // ): TResult {
  //   const name = isFunction(typeOrToken) ? providerNameGenerate(typeOrToken) : typeOrToken
  //
  //   const wrapper = this.getProvider(name)
  //   if (isNil(wrapper)) {
  //     throw new InvalidProviderIdException(name);
  //   }
  //   if (
  //     wrapper.scope === Scope.REQUEST ||
  //     wrapper.scope === Scope.TRANSIENT
  //   ) {
  //     throw new InvalidClassScopeException(typeOrToken);
  //   }
  //   return (wrapper.instance as unknown) as TResult;
  // }
}
