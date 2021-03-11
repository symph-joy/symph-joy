import {
  ClassProvider,
  EntryType,
  FactoryProvider,
  Provider,
  Type,
  ValueProvider,
} from "./interfaces";
import {
  CONFIGURATION_METADATA,
  INJECTABLE_METADATA,
  METADATA,
} from "./constants";
import { isFunction, isNil, isObject } from "./utils/shared.utils";
import { JoyContainer } from "./injector";

export class ProviderScanner {
  constructor(private readonly container: JoyContainer) {}

  public scan(config: EntryType): Provider[] {
    let providers = [];
    if (isObject(config)) {
      providers = this.scanObject(config);
    } else if (isFunction(config)) {
      if (this.isConfigurationClass(config)) {
        providers = this.scanForConfig(config);
      }
    }
    providers.forEach((provider) => {
      this.container.addProvider(provider);
    });
    return providers;
  }

  public scanObject(
    obj: Record<string, unknown>,
    ctxRegistry: EntryType[] = []
  ): Provider[] {
    let providers: Provider[] = [];
    if (ctxRegistry.includes(obj)) {
      return providers;
    }
    ctxRegistry.push(obj);
    Object.keys(obj).forEach((prop) => {
      const propValue = obj[prop];
      if (isNil(propValue) || !isFunction(propValue)) return;
      if (this.isConfigurationClass(propValue)) {
        providers = providers.concat(
          this.scanForConfig(propValue, ctxRegistry)
        );
        return;
      }
      const injectable = Reflect.getMetadata(INJECTABLE_METADATA, propValue);
      if (!isNil(injectable)) {
        providers.push(injectable);
      }
    });
    return providers;
  }

  public isConfigurationClass(val: unknown): val is Type<unknown> {
    if (isNil(val)) {
      return false;
    }
    const configMetaData = Reflect.getMetadata(CONFIGURATION_METADATA, val);
    if (!isNil(configMetaData)) {
      return true;
    }
    return false;
  }

  public scanForConfig(
    configClazz: Type<unknown>,
    ctxRegistry: EntryType[] = []
  ): Provider[] {
    let providers: Provider[] = [];
    if (!isFunction(configClazz)) {
      return providers;
    }
    if (ctxRegistry.includes(configClazz)) {
      return providers;
    }
    ctxRegistry.push(configClazz);

    const reflectProviders = Reflect.getMetadata(
      METADATA.PROVIDERS,
      configClazz.prototype
    );
    if (reflectProviders) {
      providers = providers.concat(reflectProviders);
    }
    return providers;
  }

  public reflectMetadata(metatype: Type<any>, metadataKey: string) {
    return Reflect.getMetadata(metadataKey, metatype) || [];
  }

  public isCustomProvider(
    provider: Provider
  ): provider is ClassProvider | ValueProvider | FactoryProvider {
    return provider && !isNil((provider as any).provide);
  }
}
