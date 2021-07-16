import {
  Hook,
  HookPipe,
  HookType,
  IInstanceWrapper,
  Inject,
  Injectable,
  InjectorHookTaps,
  Optional,
  ProviderLifecycle,
  Tap,
} from "@symph/core";
import {
  PROP_KEY_JOY_CONFIG_SET_VALUE,
  SYMPH_CONFIG_INIT_VALUE,
  SYMPH_CONFIG_LOADERS,
} from "./constants";
import path from "path";
import { object } from "prop-types";
import { isNil } from "@symph/core/dist/utils/shared.utils";
import { FileConfigLoader } from "./loaders/file-config-loader";
import {
  CONFIGURATION_TOKEN,
  VALIDATED_ENV_PROPNAME,
} from "./config.constants";
import get from "lodash.get";
import has from "lodash.has";
import set from "lodash.set";
import { NoInferType } from "./types";
import { ConfigLoader } from "./loaders/config-loader";

const CONFIG_FILE = "joy.config.js";

@Injectable()
export class ConfigService<K = Record<string, any>>
  implements InjectorHookTaps, ProviderLifecycle {
  @Optional()
  @Inject(SYMPH_CONFIG_LOADERS)
  public configLoaders: ConfigLoader[];

  @Hook({
    id: "addJoyConfigSchema",
    type: HookType.Waterfall,
    parallel: false,
    async: true,
  })
  private addJoyConfigSchema: HookPipe;

  @Hook({
    id: "onJoyConfigChanged",
    type: HookType.Waterfall,
    parallel: false,
    async: true,
  })
  private onJoyConfigChanged: HookPipe;

  @Tap()
  injectorAfterPropertiesSet<T>(
    instance: T,
    args: { instanceWrapper: IInstanceWrapper }
  ): T {
    const setConfigValue = (instance as any)[PROP_KEY_JOY_CONFIG_SET_VALUE];
    if (setConfigValue) {
      setConfigValue.call(instance, this.internalConfig);
    }
    return instance;
  }

  constructor(
    @Optional()
    @Inject(SYMPH_CONFIG_INIT_VALUE)
    private internalConfig: Record<string, any> = {}
  ) {}

  private _isCacheEnabled = false;
  get isCacheEnabled(): boolean {
    return this._isCacheEnabled;
  }

  set isCacheEnabled(value: boolean) {
    this._isCacheEnabled = value;
  }

  private readonly cache: Partial<K> = {} as any;

  async afterPropertiesSet(): Promise<void> {
    console.log(this.configLoaders);
  }

  public async initConfig(configPath?: string): Promise<void> {
    if (!configPath) {
      configPath = this.getConfigPath();
    }
    return this.loadConfig(configPath);
  }

  public getConfigPath(): string {
    return process.cwd();
  }

  private async loadConfig(
    // phase: string,
    dirOrPath: string
    // customConfig?: Partial<this> | null | any
  ): Promise<void> {
    if (!this.configLoaders || this.configLoaders.length === 0) {
      console.warn("Config loader is not found.");
      return;
    }
    for (const configLoader of this.configLoaders) {
      const configValues = await configLoader.loadConfig();
      this.mergeConfig(configValues);
      // this.internalConfig = configValues
    }
    // const configValues = await this.fsConfigLoader.loadConfig(dirOrPath, this.internalConfig)

    // this.mergeConfig(configValues)
  }

  get<T = any>(propertyPath: keyof K): T | undefined;

  get<T = any>(propertyPath: keyof K, defaultValue: NoInferType<T>): T;
  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath
   * @param defaultValue
   */
  get<T = any>(propertyPath: keyof K, defaultValue?: T): T | undefined {
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

  public mergeConfig(
    customConfig: { [key: string]: any },
    deepMerge = true
  ): void {
    const configs = this.internalConfig;
    Object.keys(customConfig).forEach((key) => {
      const value = customConfig[key];
      if (isNil(value)) {
        return;
      }
      if (
        deepMerge &&
        typeof value === "object" &&
        value.constructor !== Array
      ) {
        if (isNil(configs[key])) {
          configs[key] = {} as any;
        }
        this.deepMergeObj(configs[key], object);
      } else {
        configs[key] = value;
      }
    });
  }

  private deepMergeObj(objA: any = {}, objB: any): any {
    Object.keys(objB).forEach((key) => {
      if (!objB.hasOwnProperty(key)) return;
      const bValue = objB[key];
      if (isNil(bValue)) {
        return;
      }
      if (typeof bValue === "object" && bValue.constructor !== Array) {
        if (isNil(bValue)) {
          objA[key] = {} as any;
        }
        this.deepMergeObj(objA[key], bValue);
      } else {
        // 如果不是，就直接赋值
        objA[key] = bValue;
      }
    });
    return objA;
  }

  private normalizeConfig(
    // phase: string,
    config: any
  ) {
    if (typeof config === "function") {
      // config = config(phase, {defaultConfig: this});
      config = config({ defaultConfig: this });

      if (typeof config.then === "function") {
        throw new Error(
          "> Promise returned in joy config. #promise-in-next-config"
        );
      }
    }
    return config;
  }

  private getFromCache<T = any>(
    propertyPath: keyof K,
    defaultValue?: T
  ): T | undefined {
    const cachedValue = get(this.cache, propertyPath);
    return cachedValue === undefined
      ? defaultValue
      : ((cachedValue as unknown) as T);
  }

  private getFromValidatedEnv<T = any>(propertyPath: keyof K): T | undefined {
    const validatedEnvValue = get(
      this.internalConfig[VALIDATED_ENV_PROPNAME],
      propertyPath
    );
    return (validatedEnvValue as unknown) as T;
  }

  private getFromProcessEnv<T = any>(
    propertyPath: keyof K,
    defaultValue: any
  ): T | undefined {
    if (
      this.isCacheEnabled &&
      has(this.cache as Record<any, any>, propertyPath)
    ) {
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
