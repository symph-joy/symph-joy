import { Component, RegisterTap } from "@symph/core";
import { IGenerateFiles } from "../build/file-generator";
import path, { join } from "path";
import { existsSync } from "fs";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";

@Component()
export class GlobalCssPlugin {
  constructor(private joyAppConfig: JoyAppConfig) {}

  getGlobalFiles(reactRootPath: string, files: string[]): string[] {
    return files.map((file) => join(reactRootPath || "", file)).filter((file) => existsSync(file));
    // .map((file) => {
    //   let r = path.relative(reactRootPath, file)
    //   r = '.' + path.sep + r;
    //   return r
    // })
  }

  @RegisterTap()
  protected async onGenerateFiles(genFiles: IGenerateFiles) {
    const clientRoot = path.resolve(this.joyAppConfig.resolvePagesDir(), "../");
    const files = [
      "global.css",
      "global.less",
      "global.scss",
      "global.sass",
      // 'global.styl',
      // 'global.stylus',
    ];
    const globalCSSFiles = this.getGlobalFiles(clientRoot, files);

    const content = `
    ${globalCSSFiles.map((file) => `import '${file}';\n`)}
    `;

    genFiles["./react/client/joyGlobalCss.js"] = content;

    return genFiles;
  }
}
