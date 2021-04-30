import path from "path";
import { fileExists } from "../lib/file-exists";

export function getServerAutoGenerateModules(
  distDir: string
): Record<string, any>[] {
  const genServerModulesPath = path.join(
    distDir,
    "./out/server/gen-server-modules.js"
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
