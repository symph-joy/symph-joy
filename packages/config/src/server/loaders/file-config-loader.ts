import { RuntimeException } from "@symph/core";
import fs from "fs";
import { IConfigLoader } from "../../loader/config-loader.interface";
import { readConfigFile } from "./read-config-file";
import { ConfigNotExistException } from "../../errors/config-not-exist-exception";

export class FileConfigLoader implements IConfigLoader {
  constructor(public filePath: string, public propName?: string) {}

  public async loadConfig(): Promise<Record<string, any>> {
    const filePath = this.filePath;
    if (!fs.existsSync(filePath)) {
      throw new ConfigNotExistException(filePath);
    }
    console.log(`info: Using config "${filePath}".`);

    const stats = fs.statSync(filePath);
    let config: any;
    if (stats.isFile()) {
      config = await readConfigFile(filePath);
    } else {
      throw new RuntimeException("Read config failed, path(${filePath}) is a directory.");
    }
    if (this.propName) {
      config = { [this.propName]: config };
    }
    return config;
  }
}
