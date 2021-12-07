import { IConfigLoader } from "../loader/config-loader.interface";
import { DotenvConfigLoader } from "./loaders/dotenv-config-loader";
import { DirConfigLoader } from "./loaders/dir-config-loader";
import path, { resolve } from "path";
import { FileConfigLoader } from "./loaders/file-config-loader";
import { ConfigLoaderFactory } from "../loader/config-loader-factory";
import { existsSync, readdirSync } from "fs-extra";

export interface ServerConfigLoaderOptions {
  envFile?: string | string[];
  envExpandVariables?: boolean;
  ignoreEnvVars?: boolean;
  fileName?: string;
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

  public getLoaders(configs: Record<string, any>): IConfigLoader[] {
    const dir = configs.dir;
    const {
      envFile = [],
      envExpandVariables = true,
      ignoreEnvVars = false,
      fileName = "joy.config.js",
      configFilePath = [],
    }: ServerConfigLoaderOptions = this.options;

    const configFilePaths = Array.isArray(configFilePath) ? configFilePath : [configFilePath];
    const envFiles = Array.isArray(envFile) ? envFile : [envFile];

    const loaders = [] as IConfigLoader[];

    loaders.push(new DotenvConfigLoader(envFiles, envExpandVariables, ignoreEnvVars));

    // dir loaders
    if (fileName) {
      const loader = new DirConfigLoader(dir, fileName);
      const loadedFilePath = loader.configFilePath;
      if (loadedFilePath) {
        loaders.push(loader);
      }
    }

    // /config/* dir loaders
    const configsDir = path.join(dir, "config");
    if (existsSync(configsDir)) {
      const env = process.env.JOY_ENV || process.env.NODE_ENV;
      const configsLoaders = this.getConfigDirLoaders(configsDir, env);
      if (configsLoaders) {
        loaders.push(...configsLoaders);
      }
    }

    // file loaders
    for (const it of configFilePaths) {
      const absPath = resolve(it);
      loaders.push(new FileConfigLoader(absPath));
    }

    return loaders;
  }

  protected filterAndSortConfigs(files: string[], filter: (s: string) => boolean): string[] {
    const rstFiles = files.filter(filter);
    if (!rstFiles?.length) {
      return [];
    }

    const mainConfigIndex = rstFiles.findIndex((f) => /^config\./.test(f));
    if (mainConfigIndex >= 0) {
      files[mainConfigIndex] = String.fromCharCode(0) + rstFiles[mainConfigIndex];
    }
    const sorted = rstFiles.sort((a, b) => (a < b ? -1 : 1));
    sorted[0] = sorted[0].replace(String.fromCharCode(0), "");
    return sorted;
  }

  protected getConfigDirLoaders(configDirPath: string, env: string | undefined): IConfigLoader[] | undefined {
    const files = readdirSync(configDirPath);
    if (!files?.length) {
      return;
    }

    const commonConfigFiles = this.filterAndSortConfigs(files, (f) => /^[^.]+\.(jsx?|tsx?|json|mjs)/.test(f));
    let envConfigFiles: string[] | undefined;
    if (env) {
      const envRegexp = new RegExp(`^[^.]+\\.${env}\\.(jsx?|tsx?|json|mjs)$`);
      envConfigFiles = this.filterAndSortConfigs(files, (f) => envRegexp.test(f));
    }
    let localConfigs: string[] | undefined;
    if ("local" !== env) {
      localConfigs = this.filterAndSortConfigs(files, (f) => /^[^.]+\.local\.(jsx?|tsx?|json|mjs)/.test(f));
    }
    const configFiles = [] as string[];
    if (commonConfigFiles?.length) configFiles.push(...commonConfigFiles);
    if (envConfigFiles?.length) configFiles.push(...envConfigFiles);
    if (localConfigs?.length) configFiles.push(...localConfigs);

    const loaders = [] as IConfigLoader[];
    for (const file of configFiles) {
      const absPath = path.join(configDirPath, file);
      const configName = file.slice(0, file.indexOf("."));
      let propName: string | undefined;
      if (configName !== "config") {
        propName = configName;
      }
      loaders.push(new FileConfigLoader(absPath, propName));
    }
    return loaders;
  }
}
