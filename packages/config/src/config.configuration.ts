import { Configuration, CoreContext } from "@symph/core";
import { ConfigService, ConfigServiceOptions } from "./config.service";
import { SYMPH_CONFIG_DEFAULT_VALUE, SYMPH_CONFIG_OPTIONS } from "./constants";
import { ConfigLoaderFactory } from "./loader/factories/config-loader-factory";

@Configuration()
export class ConfigConfiguration {
  constructor(protected context: CoreContext) {}

  protected isAutoLoadConfig(): boolean {
    return true;
  }

  @Configuration.Provider()
  public configService: ConfigService;

  @Configuration.Provider()
  public getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ConfigLoaderFactory();
  }

  @Configuration.Provider({ name: SYMPH_CONFIG_DEFAULT_VALUE, type: Object })
  getDefaultConfig(): Record<string, unknown> {
    return {};
  }

  @Configuration.Provider({ name: SYMPH_CONFIG_OPTIONS, type: Object })
  getConfigServiceOptions(): ConfigServiceOptions {
    return {
      isAutoLoadConfig: this.isAutoLoadConfig(),
    };
  }

  // @Configuration.Provider({ name: SYMPH_CONFIG_LOADERS, type: Object })
  // private async _getConfigLoaders(
  //   @Optional() @Inject(SYMPH_CONFIG_INIT_VALUE) initValue: Record<string, any>
  // ): Promise<ConfigLoader[]> {
  //   return this.getConfigLoaders(initValue);
  // }
  //
  // protected async getConfigLoaders(
  //   initConfig: Record<string, unknown>
  // ): Promise<ConfigLoader[]> {
  //   return [];
  // }
}
