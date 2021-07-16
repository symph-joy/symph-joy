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
import { ConfigConfiguration } from "./config.configuration";
import path from "path";
import { DirConfigLoader } from "./loaders/dir-config-loader";

@Configuration()
@Injectable()
export class ServerConfigConfiguration extends ConfigConfiguration {
  protected async getConfigLoaders(): Promise<ConfigLoader[]> {
    const configService = await this.context.get(ConfigService);
    const dir = configService.get("dir");
    const loaders = [];
    let dirConfigPath: string | undefined;
    if (dir) {
      const loader = new DirConfigLoader(dir, "joy.config.js");
      dirConfigPath = loader.findConfigPath();
      loaders.push(loader);
    }

    const configPath = configService.get("configPath");
    if (configPath && configPath !== dirConfigPath) {
      loaders.push(new FileConfigLoader(configPath));
    }

    return loaders;
  }
}
