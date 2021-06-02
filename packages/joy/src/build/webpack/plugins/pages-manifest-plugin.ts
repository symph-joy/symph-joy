import webpack, { Compiler, WebpackPluginInstance } from "webpack";
import sources from "webpack-sources";
import { PAGES_MANIFEST } from "../../../joy-server/lib/constants";
import getRouteFromEntrypoint from "../../../joy-server/server/get-route-from-entrypoint";

export type PagesManifest = { [page: string]: string };

// @ts-ignore: TODO: remove ignore when webpack 5 is stable
const { RawSource } = webpack.sources || sources;

const isWebpack5 = parseInt(webpack.version!) === 5;

// This plugin creates a pages-manifest.json from page entrypoints.
// This is used for mapping paths like `/` to `.joy/out/server/static/<buildid>/pages/index.js` when doing SSR
// It's also used by joy export to provide defaultPathMap
export default class PagesManifestPlugin implements WebpackPluginInstance {
  serverless: boolean;

  constructor(serverless: boolean) {
    this.serverless = serverless;
  }

  createAssets(compilation: any, assets: any) {
    const entrypoints = compilation.entrypoints;
    const pages: PagesManifest = {};

    for (const entrypoint of entrypoints.values()) {
      const pagePath = getRouteFromEntrypoint(entrypoint.name, this.serverless);

      if (!pagePath) {
        continue;
      }

      const files = entrypoint
        .getFiles()
        .filter(
          (file: string) =>
            !file.includes("webpack-runtime") && file.endsWith(".js")
        );

      if (files.length > 1) {
        console.log(
          `Found more than one file in server entrypoint ${entrypoint.name}`,
          files
        );
        continue;
      }

      // Write filename, replace any backslashes in path (on windows) with forwardslashes for cross-platform consistency.
      pages[pagePath] = files[0].replace(/\\/g, "/");
    }

    assets[PAGES_MANIFEST] = new RawSource(JSON.stringify(pages, null, 2));
  }

  apply(compiler: Compiler): void {
    if (isWebpack5) {
      compiler.hooks.make.tap("JoyJsPagesManifest", (compilation) => {
        // @ts-ignore TODO: Remove ignore when webpack 5 is stable
        compilation.hooks.processAssets.tap(
          {
            name: "JoyJsPagesManifest",
            // @ts-ignore TODO: Remove ignore when webpack 5 is stable
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          (assets: any) => {
            this.createAssets(compilation, assets);
          }
        );
      });
      return;
    }

    compiler.hooks.emit.tap("JoyJsPagesManifest", (compilation: any) => {
      this.createAssets(compilation, compilation.assets);
    });
  }
}
