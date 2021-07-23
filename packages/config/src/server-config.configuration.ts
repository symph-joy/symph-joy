import { Configuration } from "@symph/core";
import { FileConfigLoader } from "./loaders/file-config-loader";
import { ConfigLoader } from "./loaders/config-loader";
import { ConfigConfiguration } from "./config.configuration";
import { DirConfigLoader } from "./loaders/dir-config-loader";

@Configuration()
export class ServerConfigConfiguration extends ConfigConfiguration {
  protected async getConfigLoaders(
    initConfig: Record<string, unknown>
  ): Promise<ConfigLoader[]> {
    const dir = initConfig.dir as string;
    const configPath = initConfig.configPath as string;
    const loaders = [];
    let dirConfigPath: string | undefined;
    if (dir) {
      const loader = new DirConfigLoader(dir, "joy.config.js");
      dirConfigPath = loader.findConfigPath();
      loaders.push(loader);
    }

    if (configPath && configPath !== dirConfigPath) {
      loaders.push(new FileConfigLoader(configPath));
    }

    return loaders;
  }
}
