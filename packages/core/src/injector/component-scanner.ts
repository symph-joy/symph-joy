import { EntryType, TComponent, Type } from "../interfaces";
import { METADATA } from "../constants";
import { isFunction, isNil, isObject } from "../utils/shared.utils";
import { getComponentMeta, getConfigurationMeta } from "../decorators";

export class ComponentScanner {
  private ctxRegistry: EntryType[] = [];

  public scan(
    config: EntryType | TComponent | (EntryType | TComponent)[]
    // ctxRegistry: EntryType[] = []
  ): TComponent[] {
    let providers: TComponent[] = [];
    if (Array.isArray(config)) {
      if (config.length > 0) {
        config.forEach((it) => {
          providers = providers.concat(this.scan(it));
        });
      }
    } else if (isFunction(config)) {
      providers = this.scanForConfig(config as Type);
    } else if (isObject(config)) {
      providers = this.scanObject(config);
    }
    return providers;
  }

  public scanObject(
    obj: Record<string, unknown>
    // ctxRegistry: EntryType[] = []
  ): TComponent[] {
    const ctxRegistry = this.ctxRegistry;
    let providers: TComponent[] = [];
    if (ctxRegistry.includes(obj)) {
      return providers;
    }
    if (this.isProvider(obj)) {
      providers.push(obj);
      return providers;
    }
    ctxRegistry.push(obj);
    Object.keys(obj).forEach((prop) => {
      const propValue = obj[prop];
      if (isNil(propValue)) return;

      // 1. value provider
      if (this.isProvider(propValue)) {
        // @ts-ignore
        providers.push({ name: prop, ...propValue });
      }

      if (isFunction(propValue)) {
        if (this.isConfigurationClass(propValue)) {
          // 3. configuration class
          providers = providers.concat(this.scanForConfig(propValue));
        } else {
          // 2. class provider
          const componentMeta = getComponentMeta(propValue);
          if (!isNil(componentMeta)) {
            providers.push({ ...componentMeta });
          }
        }
      }
    });
    return providers;
  }

  public scanForConfig(
    configClazz: Type<unknown>
    // ctxRegistry: EntryType[] = []
  ): TComponent[] {
    const ctxRegistry = this.ctxRegistry;
    let providers: TComponent[] = [];
    if (!isFunction(configClazz)) {
      return providers;
    }
    if (ctxRegistry.includes(configClazz)) {
      return providers;
    }
    ctxRegistry.push(configClazz);

    const componentMeta = getComponentMeta(configClazz);
    componentMeta && providers.push(componentMeta);

    const configMeta = getConfigurationMeta(configClazz);
    if (configMeta?.imports) {
      const importKeys = Object.keys(configMeta.imports);
      for (const importKey of importKeys) {
        providers = providers.concat(this.scan(configMeta.imports[importKey]));
      }
    }

    const reflectProviders = Reflect.getMetadata(METADATA.PROVIDERS, configClazz.prototype) as TComponent[];
    if (reflectProviders) {
      const ownerProviders = [] as TComponent[];
      reflectProviders.forEach((provider) => {
        ownerProviders.push(provider);
        // 扫描通过属性定义导入的configuration类
        if (this.isConfigurationClass(provider.type)) {
          let propImportProviders = this.scanForConfig(provider.type);
          if (propImportProviders && propImportProviders.length) {
            ownerProviders.push(...propImportProviders.slice(1));
          }
        }
      });

      providers = providers.concat(ownerProviders);
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

  public isProvider(val: any): val is TComponent {
    return val && typeof val === "object" && (val.useFactory || val.useValue || val.useClass);
  }
}
