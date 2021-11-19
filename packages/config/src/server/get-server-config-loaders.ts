import { resolve } from "path";
import { FileConfigLoader } from "./loaders/file-config-loader";
import { ConfigLoader } from "../loader/config-loader";
import { DirConfigLoader } from "./loaders/dir-config-loader";
import { DotenvConfigLoader } from "./loaders/dotenv-config-loader";

// export class ServerConfigLoaders {
export function getServerConfigLoaders(
  dir: string,
  {
    envFile = [],
    envExpandVariables = true,
    ignoreEnvVars = false,
    fileName = "joy.config.js",
    configFilePath = [],
  }: {
    envFile: string | string[];
    envExpandVariables: boolean;
    ignoreEnvVars: boolean;
    fileName: string | string[];
    configFilePath: string | string[];
  }
): ConfigLoader[] {
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

// }
