import { JoyAppConfig } from "../next-server/server/joy-config/joy-app-config";
import { Injectable } from "@symph/core";

@Injectable()
export class JoyGenModuleServerProvider {
  constructor(private joyAppConfig: JoyAppConfig) {}

  public async getAutoGenerateModules(): Promise<any[]> {
    const genServerModulesPath = this.joyAppConfig.resolveAppDir(
      this.joyAppConfig.distDir,
      "./out/server/gen-server-modules.js"
    );
    const modules = require(genServerModulesPath);
    return modules.default || modules;
    // if (await fileExists(genServerModulesPath)){
    //   const modules = require(genServerModulesPath)
    //   return  modules.default || modules
    // } else {
    //   return  []
    // }
  }
}
