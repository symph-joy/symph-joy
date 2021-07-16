import fs from "fs";
import { resolve } from "path";
import * as dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { ConfigLoader } from "./config-loader";
import { ConfigNotExistException } from "../errors/config-not-exist-exception";

export class DotenvConfigLoader extends ConfigLoader {
  protected envFiles: string[];

  constructor(
    public envFile: string[] | string = resolve(process.cwd(), ".env"),
    public expandVariables: boolean = true,
    public ignoreEnvVars: boolean = false
  ) {
    super();
    this.envFiles = Array.isArray(this.envFile) ? this.envFile : [this.envFile];
  }

  public async loadConfig(): Promise<Record<string, any>> {
    let config = this.loadEnvFile(this.envFiles, this.expandVariables);
    if (!this.ignoreEnvVars) {
      config = {
        ...config,
        ...process.env,
      };
    }
    return config;
  }

  public loadEnvFile(
    envFilePaths: string[],
    expandVariables = true
  ): Record<string, any> {
    let config: ReturnType<typeof dotenv.parse> = {};
    for (const envFilePath of envFilePaths) {
      if (fs.existsSync(envFilePath)) {
        config = Object.assign(
          dotenv.parse(fs.readFileSync(envFilePath)),
          config
        );
        if (expandVariables) {
          config = dotenvExpand({ parsed: config }).parsed || config;
        }
      } else {
        throw new ConfigNotExistException(envFilePath);
      }
    }
    return config;
  }
}
