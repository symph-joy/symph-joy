import path from "path";
import { JoyAppConfig } from "../joy-server/server/joy-config/joy-app-config";
import { REACT_OUT_DIR } from "./react-const";
import { Injectable } from "@symph/core";

/**
 * 该类可以删除了
 */
@Injectable()
export class JoyReactConfig {
  constructor(private joyAppConfig: JoyAppConfig) {}

  getServerAutoGenerateModules(): Record<string, any>[] {
    const distDir = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir);
    const genServerModulesPath = path.join(
      distDir,
      REACT_OUT_DIR,
      "server/gen-server-modules.js"
    );
    const modules = require(genServerModulesPath);
    return modules.default || modules;
    // if (await fileExists(genServerModulesPath)){
    //   const modules = require(genServerModulesPath)
    //   return  modules.default || modules
    // } else {
    //   console.warn('canot.')
    //   return  []
    // }
  }
}
