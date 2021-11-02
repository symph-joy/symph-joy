import fs from "fs";
import findUp from "find-up";
import { basename, extname } from "path";
import { ConfigLoader } from "./config-loader";
import { ConfigNotExistException } from "../../errors/config-not-exist-exception";
import { readConfigFile } from "./utils/read-config-file";
import { ConfigPathIsFileException } from "../../errors/config-path-is-file-exception";

export class DirConfigLoader extends ConfigLoader {
  constructor(public dir: string, public configName: string) {
    super();
  }

  public findConfigPath(): string | undefined {
    return findUp.sync(this.configName, {
      cwd: this.dir,
    });
  }

  public async loadConfig(): Promise<Record<string, any>> {
    if (!fs.existsSync(this.dir)) {
      throw new ConfigNotExistException(this.dir);
    }

    const stats = fs.statSync(this.dir);
    let config: any;
    if (stats.isFile()) {
      throw new ConfigPathIsFileException(this.dir);
    } else if (stats.isDirectory()) {
      const configPath = this.findConfigPath();
      if (configPath?.length) {
        config = await readConfigFile(configPath);
        console.log(`Info: Read config value from "${configPath}".`);
      } else {
        const configFileName = this.configName;
        const configBaseName = basename(configFileName, extname(configFileName));
        const nonJsPath = findUp.sync([`${configBaseName}.jsx`, `${configBaseName}.ts`, `${configBaseName}.tsx`, `${configBaseName}.json`], { cwd: this.dir });
        if (nonJsPath?.length) {
          throw new Error(`Configuring Joy via "${basename(nonJsPath)}" is not supported. Please replace the file with "${configBaseName}".`);
        } else {
          console.log(`Info: Config file "${configBaseName}.js" was not found.`);
          // throw new ConfigNotExistException(this.dir);
        }
      }
    }
    return config;
  }
}
