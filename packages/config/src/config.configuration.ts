import { Configuration, ApplicationContext } from "@symph/core";
import { ConfigService, ConfigServiceOptions } from "./config.service";
import { CONFIG_DEFAULT_VALUE, CONFIG_OPTIONS } from "./constants";
import { ConfigLoaderFactory } from "./loader/config-loader-factory";

@Configuration()
export class ConfigConfiguration {
  constructor(protected context: ApplicationContext) {}

  protected isAutoLoadConfig(): boolean {
    return true;
  }

  @Configuration.Component()
  public configService: ConfigService;

  @Configuration.Component()
  public getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ConfigLoaderFactory();
  }

  @Configuration.Component({ name: CONFIG_DEFAULT_VALUE })
  getDefaultConfig(): Record<string, unknown> {
    return {};
  }

  @Configuration.Component({ name: CONFIG_OPTIONS })
  getConfigServiceOptions(): ConfigServiceOptions {
    return {
      isAutoLoadConfig: this.isAutoLoadConfig(),
    };
  }

  // @Configuration.Component({ name: SYMPH_CONFIG_LOADERS, type: Object })
  // private async _getConfigLoaders(
  //   @Optional() @Inject(CONFIG_INIT_VALUE) initValue: Record<string, any>
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
