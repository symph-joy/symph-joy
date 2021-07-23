import {
  Configuration,
  CoreContext,
  Inject,
  Injectable,
  Optional,
  ProviderLifecycle,
} from "@symph/core";
import { ConfigService } from "./config.service";
import { SYMPH_CONFIG_INIT_VALUE, SYMPH_CONFIG_LOADERS } from "./constants";
import { ConfigModuleOptions } from "./types/config-options.interface";
import { ConfigLoader } from "./loaders/config-loader";

const defaultOptions: ConfigModuleOptions = {
  // cache: true
};

@Configuration()
export class ConfigConfiguration {
  constructor(protected context: CoreContext) {}

  @Configuration.Provider()
  public configService: ConfigService;

  getDefaultConfig(): ConfigModuleOptions {
    return defaultOptions;
  }

  @Configuration.Provider({ id: SYMPH_CONFIG_LOADERS, type: Object })
  private async _getConfigLoaders(
    @Optional() @Inject(SYMPH_CONFIG_INIT_VALUE) initValue: Record<string, any>
  ): Promise<ConfigLoader[]> {
    return this.getConfigLoaders(initValue);
  }

  protected async getConfigLoaders(
    initConfig: Record<string, unknown>
  ): Promise<ConfigLoader[]> {
    return [];
  }
}
