import {
  Configuration,
  CoreContext,
  Inject,
  Injectable,
  Optional,
  ProviderLifecycle,
} from "@symph/core";
import { ConfigService } from "./config.service";
import { FileConfigLoader } from "./loaders/file-config-loader";
import { SYMPH_CONFIG_INIT_VALUE, SYMPH_CONFIG_LOADERS } from "./constants";
import { ConfigModuleOptions } from "./types/config-options.interface";
import { ConfigLoader } from "./loaders/config-loader";
import { EnvConfigLoader } from "./loaders/env-config-loader";
import { validate } from "class-validator";

const defaultOptions: ConfigModuleOptions = {
  // cache: true
};

@Configuration()
@Injectable()
export class ConfigConfiguration {
  constructor(protected context: CoreContext) {}

  @Configuration.Provider()
  public configService(
    @Optional() @Inject(SYMPH_CONFIG_INIT_VALUE) initValue: Record<string, any>
  ): ConfigService {
    const initConfig = Object.assign({}, this.getDefaultConfig(), initValue);
    return new ConfigService<Record<string, any>>(initConfig);
  }

  getDefaultConfig(): ConfigModuleOptions {
    return defaultOptions;
  }

  public async initConfig(): Promise<void> {
    const configService = await this.context.get(ConfigService);
    const loaders = await this.getConfigLoaders();
    for (let i = loaders.length - 1; i >= 0; i--) {
      const loader = loaders[i];
      const configValues = await loader.loadConfig();
      configService.mergeConfig(configValues);
    }
  }

  protected async getConfigLoaders(): Promise<ConfigLoader[]> {
    const loaderIds = this.context.container.getProvidersByType(ConfigLoader);
    const loaders = await Promise.all(
      loaderIds.map((loaderId) => this.context.get<ConfigLoader>(loaderId))
    );
    return loaders || [];
  }
}
