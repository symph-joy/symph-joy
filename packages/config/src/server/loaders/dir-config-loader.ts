import fs from "fs";
import findUp from "find-up";
import { basename, extname } from "path";
import { IConfigLoader } from "../../loader/config-loader.interface";
import { ConfigNotExistException } from "../../errors/config-not-exist-exception";
import { ConfigPathIsFileException } from "../../errors/config-path-is-file-exception";
import { FileConfigLoader } from "./file-config-loader";

export class DirConfigLoader implements IConfigLoader {
  public fileConfigLoader: FileConfigLoader;
  public configFilePath: string | undefined;
  constructor(public dir: string, public configName: string) {
    const stats = fs.statSync(this.dir);
    if (stats.isFile()) {
      throw new ConfigPathIsFileException(this.dir);
    } else if (stats.isDirectory()) {
      if (!fs.existsSync(this.dir)) {
        throw new ConfigNotExistException(this.dir);
      }
    }

    this.configFilePath = this.findConfigPath();
    if (this.configFilePath) {
      this.fileConfigLoader = new FileConfigLoader(this.configFilePath);
    }
  }

  public findConfigPath(): string | undefined {
    const configPath = findUp.sync(this.configName, {
      cwd: this.dir,
    });
    if (!configPath) {
      const configFileName = this.configName;
      const configBaseName = basename(configFileName, extname(configFileName));
      const nonSupport = findUp.sync([`${configBaseName}.jsx`, `${configBaseName}.tsx`, `${configBaseName}.yaml`], {
        cwd: this.dir,
      });
      if (nonSupport?.length) {
        throw new Error(`Configuring Joy via "${basename(nonSupport)}" is not supported. Please replace the file with "${configBaseName}".`);
      } else {
        console.log(`Info: Config file "${configBaseName}.js" was not found.`);
      }
    }
    return configPath;
  }

  public async loadConfig(): Promise<Record<string, any> | undefined> {
    if (this.fileConfigLoader) {
      return this.fileConfigLoader.loadConfig();
    }
  }
}
