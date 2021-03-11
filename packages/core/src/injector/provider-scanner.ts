import {
  ClassProvider,
  EntryType,
  FactoryProvider,
  Provider,
  Type,
  ValueProvider,
} from "../interfaces";
import {
  CONFIGURATION_METADATA,
  INJECTABLE_METADATA,
  METADATA,
} from "../constants";
import { isFunction, isNil, isObject } from "../utils/shared.utils";
import { JoyContainer } from "./index";
import { getConfigurationMeta, IConfigurationOptions } from "../decorators";

export class ProviderScanner {
  constructor(private readonly container: JoyContainer) {} // todo remove container

  public scan(
    config: EntryType | EntryType[],
    ctxRegistry: EntryType[] = []
  ): Provider[] {
    let providers: Provider[] = [];
    if (Array.isArray(config)) {
      if (config.length > 0) {
        config.forEach((it) => {
          providers = providers.concat(this.scan(it, ctxRegistry));
        });
      }
    } else if (isFunction(config)) {
      if (this.isConfigurationClass(config)) {
        providers = this.scanForConfig(config, ctxRegistry);
      }
    } else if (isObject(config)) {
      providers = this.scanObject(config, ctxRegistry);
    }
    // providers.forEach((provider) => {
    //   this.container.addProvider(provider);
    // });
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
      if (isNil(propValue)) return;

      // 1. value provider
      if (this.isValueProvider(propValue)) {
        // @ts-ignore
        providers.push({ id: prop, ...propValue });
      }

      if (isFunction(propValue)) {
        // 2. configuration class
        if (this.isConfigurationClass(propValue)) {
          providers = providers.concat(
            this.scanForConfig(propValue, ctxRegistry)
          );
          return;
        }
        // 3. origin provider class
        const injectable = Reflect.getMetadata(INJECTABLE_METADATA, propValue);
        if (!isNil(injectable)) {
          providers.push({ ...injectable });
        }
      }
    });
    return providers;
  }

  public isConfigurationClass(val: any): val is Type<unknown> {
    if (isNil(val)) {
      return false;
    }
    const configMetaData = getConfigurationMeta(val);
    if (undefined !== configMetaData && null !== configMetaData) {
      return true;
    }
    return false;
  }

  public isValueProvider(val: any): val is Provider {
    return (
      val &&
      typeof val === "object" &&
      (val.useFactory || val.useValue || val.useClass)
    );
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

    const configMeta = getConfigurationMeta(configClazz);
    if (configMeta?.imports) {
      for (let i = 0; i < configMeta.imports.length; i++) {
        providers = providers.concat(
          this.scan(configMeta.imports[i], ctxRegistry)
        );
      }
    }

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
