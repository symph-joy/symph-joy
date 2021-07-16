import { Injectable, RuntimeException } from "@symph/core";
import fs from "fs";
import findUp from "find-up";
import path, { basename, extname } from "path";
import { IConfigLoader } from "../interfaces/config-loader.interface";
import { ConfigLoader } from "./config-loader";

export class NotExistConfig extends RuntimeException {
  constructor(path: string) {
    super();
    this.message = `Can not load config, the path(${path}) is not exists.`;
  }
}

@Injectable()
export class EnvConfigLoader implements ConfigLoader {
  public async loadConfig(
    path: string,
    curConfig: Record<string, any>
  ): Promise<Record<string, any>> {
    return {};
  }
}
