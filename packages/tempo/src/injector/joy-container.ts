import {
  Abstract,
  ClassProvider,
  FactoryProvider,
  IInjectable,
  Provider,
  Scope,
  Type,
  ValueProvider,
} from "../interfaces";
import { isEmpty, isNil, isString, isUndefined } from "../utils/shared.utils";
import { InstanceWrapper } from "./instance-wrapper";
import { RuntimeException } from "../errors/exceptions/runtime.exception";

type ProviderId = string;

interface ProviderName {
  name?: string | symbol;
}

interface ProviderIndex {
  touchIndex(indexKey: string);

  get(indexKey): ProviderId[];

  add(indexKey, providerId: ProviderId);

  remove(indexKey, providerId: ProviderId);
}

class StringProviderIndex implements ProviderIndex {
  private indexValues: { [name: string]: ProviderId[] } = {};

  touchIndex(indexKey: string) {
    const values = this.indexValues[indexKey];
    if (!isNil(values)) {
      return;
    }
    this.indexValues[indexKey] = [];
  }

  add(indexKey: string, providerId: ProviderId) {
    let values = this.indexValues[indexKey];
    if (isUndefined(values)) {
      values = [];
      this.indexValues[indexKey] = values;
    } else {
      if (values.indexOf(providerId) >= 0) {
        throw new RuntimeException(`provider(${indexKey}) has existed`);
      }
    }
    values.push(providerId);
  }

  get(indexKey: string): ProviderId[] {
    return this.indexValues[indexKey];
  }

  remove(indexKey: string, providerId: ProviderId) {
    //todo
  }
}

export class JoyContainer {
  // private readonly _providers = new Map<string, InstanceWrapper<Injectable>>()

  private _providerIdCounter = 1;
  private readonly _providerStore = new Map<
    ProviderId,
    InstanceWrapper<IInjectable>
  >();
  private readonly _typeCache = new Map<
    Type | Abstract,
    Map<Type | Abstract, string[]>
  >();
  // private nameProviderIndices = new StringProviderIndex()
  // private moduleProviderIndices = new StringProviderIndex()

  get providers(): Map<ProviderId, InstanceWrapper<IInjectable>> {
    return this._providerStore;
  }

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
    // const providerId = this._providerIdCounter++
    this._providerStore.set(instanceWrapper.name, instanceWrapper);
    this.addToCache(instanceWrapper);
    return instanceWrapper;
  }

  private addToCache(instanceWrapper: InstanceWrapper<IInjectable>): void {
    const { type, name } = instanceWrapper;
    if (!type) {
      throw new RuntimeException(
        `provider's type, must not be null. provider name:${name}`
      );
    }
    let proto = type;
    let ids: string[] = this._typeCache.get(type)?.get(type);
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

  public addProvider(provider: Provider): InstanceWrapper {
    if (this.isCustomClass(provider)) {
      return this.addCustomClass(provider);
    } else if (this.isCustomValue(provider)) {
      return this.addCustomValue(provider);
    } else if (this.isCustomFactory(provider)) {
      return this.addCustomFactory(provider);
    }
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
    const { id, useClass, scope } = provider;
    return this.addWrapper(
      new InstanceWrapper({
        name: id,
        type: useClass,
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

  // public replace(toReplace: string | Type<any>, options: any) {
  //   if (options.isProvider && this.hasProvider(toReplace)) {
  //     const name = this.getProviderStaticToken(toReplace)
  //     const originalProvider = this.getProviderByName(name)
  //
  //     return originalProvider.mergeWith({provide: toReplace, ...options})
  //   }
  // }

  // public hasProvider(nameOrType: string | Type<any>): boolean {
  //   if (isString(nameOrType)) {
  //     return !isEmpty(this._providerStore.get(nameOrType))
  //   }
  //
  //   //toto class
  // }

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

  public getProviderByName<T = any>(name: string): InstanceWrapper<T> | null {
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
