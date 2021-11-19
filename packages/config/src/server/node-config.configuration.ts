import { Configuration } from "@symph/core";
import { ConfigConfiguration } from "../config.configuration";
import { ServerConfigLoaderFactory } from "./server-config-loader-factory";
import { ConfigLoaderFactory } from "../loader/config-loader-factory";

@Configuration()
export class NodeConfigConfiguration extends ConfigConfiguration {
  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ServerConfigLoaderFactory();
  }

  getDefaultConfig(): Record<string, unknown> {
    const defaultConfigs = super.getDefaultConfig();
    return Object.assign({}, defaultConfigs, {
      dir: process.cwd(),
    });
  }

  // protected async getConfigLoaders(
  //   initConfig: Record<string, unknown>
  // ): Promise<ConfigLoader[]> {
  //   const dir = initConfig.dir as string;
  //   const configPath = initConfig.configPath as string;
  //   const loaders = [] as ConfigLoader[];
  //
  //   loaders.push(new DotenvConfigLoader(dir))
  //
  //   let dirConfigPath: string | undefined;
  //   if (dir) {
  //     const loader = new DirConfigLoader(dir, "joy.config.js");
  //     dirConfigPath = loader.findConfigPath();
  //     loaders.push(loader);
  //   }
  //
  //   if (configPath && configPath !== dirConfigPath) {
  //     loaders.push(new FileConfigLoader(configPath));
  //   }
  //
  //   return loaders;
  // }
}
