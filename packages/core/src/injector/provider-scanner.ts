import {
  ClassProvider,
  EntryType,
  FactoryProvider,
  isClassProvider,
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
      // 模拟一个配置对象
      providers = this.scanObject({ [config.name]: config });
    } else if (isObject(config)) {
      providers = this.scanObject(config, ctxRegistry);
    }
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
        // 2. provider class
        const injectable = Reflect.getMetadata(INJECTABLE_METADATA, propValue);
        if (!isNil(injectable)) {
          providers.push({ id: prop, ...injectable });
        }

        // 3. configuration class
        if (this.isConfigurationClass(propValue)) {
          providers = providers.concat(
            this.scanForConfig(propValue, ctxRegistry)
          );
        }
      }
    });
    return providers;
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
    ) as Provider[];

    const configMeta = getConfigurationMeta(configClazz);
    if (configMeta?.imports) {
      const importKeys = Object.keys(configMeta.imports);
      for (const importKey of importKeys) {
        providers = providers.concat(
          this.scan(configMeta.imports[importKey], ctxRegistry)
        );
      }

      // for (let i = 0; i < configMeta.imports.length; i++) {
      //   providers = providers.concat(
      //     this.scan(configMeta.imports[i], ctxRegistry)
      //   );
      // }
    }

    if (reflectProviders) {
      reflectProviders.forEach((provider) => {
        // 识别导入的configuration类，将configuration类添加的imports中，以便后续扫描
        if (this.isConfigurationClass(provider.type)) {
          let typeProviders = this.scan(provider.type, ctxRegistry);
          // 去取@Configuration类的本身定义，优先使用自定义属性
          const index = typeProviders.findIndex(
            (it) => isClassProvider(it) && it.useClass === provider.type
          );
          typeProviders.splice(index, 1);
          providers = providers.concat(typeProviders);
        }
      });
      providers = providers.concat(reflectProviders);
    }

    return providers;
  }

  public reflectMetadata(metatype: Type<any>, metadataKey: string) {
    return Reflect.getMetadata(metadataKey, metatype) || [];
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

  public isCustomProvider(
    provider: Provider
  ): provider is ClassProvider | ValueProvider | FactoryProvider {
    return provider && !isNil((provider as any).provide);
  }
}
