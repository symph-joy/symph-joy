import { ConfigLoader } from "../loader/config-loader";
import { DotenvConfigLoader } from "./loaders/dotenv-config-loader";
import { DirConfigLoader } from "./loaders/dir-config-loader";
import { resolve } from "path";
import { FileConfigLoader } from "./loaders/file-config-loader";
import { ConfigLoaderFactory } from "../loader/config-loader-factory";

export interface ServerConfigLoaderOptions {
  envFile?: string | string[];
  envExpandVariables?: boolean;
  ignoreEnvVars?: boolean;
  fileName?: string | string[];
  configFilePath?: string | string[];
}

export class ServerConfigLoaderFactory extends ConfigLoaderFactory {
  // public async loadConfig(dir: string, {
  //   envFile = [],
  //   envExpandVariables = true,
  //   ignoreEnvVars = false,
  //   fileName = 'joy.config.js',
  //   configFilePath = []
  // }: ServerConfigLoaderOptions): Promise<Record<string, unknown>> {
  //   const loaders = this.getServerConfigLoaders(dir, {envFile, envExpandVariables, ignoreEnvVars, fileName, configFilePath})
  //   let configValue = {} as Record<string, unknown>
  //   for (const loader of loaders) {
  //     const value = await loader.loadConfig();
  //     configValue = merge(configValue, value);
  //   }
  //   return configValue
  // }

  constructor(public options: ServerConfigLoaderOptions = {}) {
    super();
  }

  public getLoaders(configs: Record<string, any>): ConfigLoader[] {
    const dir = configs.dir;
    const {
      envFile = [],
      envExpandVariables = true,
      ignoreEnvVars = false,
      fileName = "joy.config.js",
      configFilePath = [],
    }: ServerConfigLoaderOptions = this.options;

    const fileNames = Array.isArray(fileName) ? fileName : [fileName];
    const configFilePaths = Array.isArray(configFilePath) ? configFilePath : [configFilePath];
    const envFiles = Array.isArray(envFile) ? envFile : [envFile];

    const loaders = [] as ConfigLoader[];

    loaders.push(new DotenvConfigLoader(envFiles, envExpandVariables, ignoreEnvVars));

    let dirConfigLoadPaths: string[] = []; // 已经通过目录查找
    for (const name of fileNames) {
      const loader = new DirConfigLoader(dir, name);
      const loadedFilePath = loader.findConfigPath();
      loadedFilePath && dirConfigLoadPaths.push(loadedFilePath);
      loaders.push(loader);
    }

    for (const it of configFilePaths) {
      const absPath = resolve(it);
      if (dirConfigLoadPaths.includes(absPath)) {
        continue;
      }
      loaders.push(new FileConfigLoader(absPath));
    }

    return loaders;
  }
}
