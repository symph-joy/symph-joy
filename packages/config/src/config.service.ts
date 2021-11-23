import {
  Autowire,
  AutowireHook,
  Component,
  HookType,
  IComponentLifecycle,
  IComponentWrapper,
  IHook,
  InjectorHookTaps,
  Optional,
  RegisterTap,
} from "@symph/core";
import { PROP_KEY_JOY_CONFIG_SET_VALUE, SYMPH_CONFIG_DEFAULT_VALUE, SYMPH_CONFIG_INIT_VALUE, SYMPH_CONFIG_OPTIONS } from "./constants";
import { VALIDATED_ENV_PROPNAME } from "./config.constants";
import get from "lodash.get";
import has from "lodash.has";
import set from "lodash.set";
import merge from "lodash.merge";
import { NoInferType } from "./types";
import { ConfigLoaderFactory } from "./loader/config-loader-factory";

export interface ConfigServiceOptions {
  isAutoLoadConfig: boolean;
}

@Component()
export class ConfigService<K = Record<string, any>> implements InjectorHookTaps, IComponentLifecycle {
  @Optional()
  @Autowire()
  public configLoaderFactory?: ConfigLoaderFactory;

  @AutowireHook({
    id: "addJoyConfigSchema",
    type: HookType.Waterfall,
    parallel: false,
    async: true,
  })
  private addJoyConfigSchema: IHook;

  @AutowireHook({
    id: "onJoyConfigChanged",
    type: HookType.Waterfall,
    parallel: false,
    async: true,
  })
  private onJoyConfigChanged: IHook;

  @RegisterTap()
  componentAfterInitialize<T>(instance: T, args: { instanceWrapper: IComponentWrapper }): T {
    const setConfigValue = (instance as any)[PROP_KEY_JOY_CONFIG_SET_VALUE];
    if (setConfigValue) {
      setConfigValue.call(instance, this.internalConfig);
    }
    return instance;
  }

  private internalConfig: Record<string, unknown>;

  constructor(
    @Optional()
    @Autowire(SYMPH_CONFIG_OPTIONS)
    private configOptions: ConfigServiceOptions = { isAutoLoadConfig: true },
    @Optional()
    @Autowire(SYMPH_CONFIG_DEFAULT_VALUE)
    private defaultConfig: Record<string, unknown> = {},
    @Optional()
    @Autowire(SYMPH_CONFIG_INIT_VALUE)
    private initConfig: Record<string, unknown> = {}
  ) {}

  private _isCacheEnabled = false;
  get isCacheEnabled(): boolean {
    return this._isCacheEnabled;
  }

  set isCacheEnabled(value: boolean) {
    this._isCacheEnabled = value;
  }

  private readonly cache: Partial<K> = {} as any;

  async initialize(): Promise<void> {
    this.internalConfig = merge({}, this.defaultConfig, this.initConfig);

    if (this.configOptions.isAutoLoadConfig) {
      await this.loadConfig();
    }
  }

  public async loadConfig(): Promise<void> {
    if (!this.configLoaderFactory) {
      console.warn("There is no config loader factory.");
      return;
    }
    const configLoaders = this.configLoaderFactory.getLoaders(this.internalConfig);
    if (!configLoaders || configLoaders.length === 0) {
      // console.info("There is no config loader.");
      return;
    }
    const loadedValues = {};
    for (const configLoader of configLoaders) {
      const configValues = await configLoader.loadConfig();
      if (configValues) {
        merge(loadedValues, configValues);
      }
    }
    Object.keys(loadedValues).length > 0 && this.mergeConfig(loadedValues);
  }

  get<T = Record<string, unknown>>(): Record<string, unknown>;
  get<T = any>(propertyPath: keyof K): T | undefined;

  get<T = any>(propertyPath: keyof K, defaultValue: NoInferType<T>): T;
  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath
   * @param defaultValue
   */
  get<T = any>(propertyPath?: keyof K, defaultValue?: T): T | undefined {
    if (typeof propertyPath === "undefined") {
      return this.internalConfig as any;
    }
    const validatedEnvValue = this.getFromValidatedEnv(propertyPath);
    if (validatedEnvValue !== undefined) {
      return validatedEnvValue;
    }

    const processEnvValue = this.getFromProcessEnv(propertyPath, defaultValue);
    if (processEnvValue !== undefined) {
      return processEnvValue;
    }

    const internalValue = this.getFromInternalConfig(propertyPath);
    if (internalValue !== undefined) {
      return internalValue;
    }

    return defaultValue;
  }

  public getConfigSchema() {
    return this.addJoyConfigSchema.call({});
  }

  public mergeConfig(customConfig: { [key: string]: any }, deepMerge = true): void {
    const configs = this.internalConfig;
    if (deepMerge) {
      merge(configs, customConfig);
    } else {
      Object.keys(customConfig).forEach((key) => {
        configs[key] = customConfig[key];
      });
    }
  }

  private normalizeConfig(
    // phase: string,
    config: any
  ) {
    if (typeof config === "function") {
      // config = config(phase, {defaultConfig: this});
      config = config({ defaultConfig: this });

      if (typeof config.then === "function") {
        throw new Error("> Promise returned in joy config. #promise-in-next-config");
      }
    }
    return config;
  }

  private getFromCache<T = any>(propertyPath: keyof K, defaultValue?: T): T | undefined {
    const cachedValue = get(this.cache, propertyPath);
    return cachedValue === undefined ? defaultValue : ((cachedValue as unknown) as T);
  }

  private getFromValidatedEnv<T = any>(propertyPath: keyof K): T | undefined {
    const validatedEnvValue = get(this.internalConfig[VALIDATED_ENV_PROPNAME], propertyPath);
    return (validatedEnvValue as unknown) as T;
  }

  private getFromProcessEnv<T = any>(propertyPath: keyof K, defaultValue: any): T | undefined {
    if (this.isCacheEnabled && has(this.cache as Record<any, any>, propertyPath)) {
      const cachedValue = this.getFromCache(propertyPath, defaultValue);
      return cachedValue !== undefined ? cachedValue : defaultValue;
    }
    const processValue = get(process.env, propertyPath);
    this.setInCacheIfDefined(propertyPath, processValue);

    return (processValue as unknown) as T;
  }

  private getFromInternalConfig<T = any>(propertyPath: keyof K): T | undefined {
    const internalValue = get(this.internalConfig, propertyPath);
    return internalValue;
  }

  private setInCacheIfDefined(propertyPath: keyof K, value: any): void {
    if (typeof value === "undefined") {
      return;
    }
    set(this.cache as Record<any, any>, propertyPath, value);
  }
}
