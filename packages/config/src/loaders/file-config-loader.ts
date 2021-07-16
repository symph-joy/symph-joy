import { RuntimeException } from "@symph/core";
import fs from "fs";
import { ConfigLoader } from "./config-loader";
import { readConfigFile } from "./utils/read-config-file";
import { ConfigNotExistException } from "../errors/config-not-exist-exception";

export class FileConfigLoader extends ConfigLoader {
  constructor(public filePath: string) {
    super();
  }

  public async loadConfig(): Promise<Record<string, any>> {
    const filePath = this.filePath;
    if (!fs.existsSync(filePath)) {
      throw new ConfigNotExistException(filePath);
    }

    const stats = fs.statSync(filePath);
    let config: any;
    if (stats.isFile()) {
      config = await readConfigFile(filePath);
    } else {
      throw new RuntimeException(
        "Read config failed, path(${filePath}) is a directory."
      );
    }
    return config;
  }
}
