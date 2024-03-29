import webpack, { RuleSetRule, RuleSetUseItem } from "webpack";
import { stringify } from "querystring";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { EmitSrcWebpackPlugin } from "./webpack/plugins/emit-src-plugin/emit-src-webpack-plugin";
import path from "path";
import { resolveRequest } from "../lib/resolve-request";
import { webpack5 } from "../types/webpack5";
import Loader = webpack5.loader.Loader;
import { existsSync } from "fs-extra";

export async function getWebpackConfigForSrc(serverConfig: webpack.Configuration, joyConfig: JoyAppConfig): Promise<webpack.Configuration> {
  const srcConfig = { ...serverConfig };
  const distDir = joyConfig.resolveAppDir(joyConfig.distDir);

  let srcDir = joyConfig.resolveAppDir("src/client");
  if (!existsSync(srcDir)) {
    srcDir = joyConfig.resolveAppDir("src/pages");
  }
  if (!existsSync(srcDir)) {
    srcDir = joyConfig.resolveAppDir("src");
  }
  srcConfig.entry = {
    "src-bundle": [`joy-require-context-loader?${stringify({ absolutePath: srcDir })}!`],
  };

  const outputPath = path.join(distDir);
  srcConfig.output = {
    path: outputPath,
    filename: "[name].js",
  };

  function modifyBabelLoaderOptions(useLoader: any) {
    if (useLoader.loader === "joy-babel-loader" && useLoader.options) {
      useLoader.options.isSrc = true;
    }
  }

  // 给babel添加src编译标识
  (serverConfig.module?.rules as RuleSetRule[]).forEach((rule) => {
    const use = rule.use as any;
    if (!use) {
      return;
    }
    if (Array.isArray(use)) {
      use.forEach((it) => {
        it && modifyBabelLoaderOptions(it);
      });
    } else {
      modifyBabelLoaderOptions(use);
    }
  });

  srcConfig.externals = ({ context, request }, callback: (err?: Error, result?: string | boolean | string[] | { [index: string]: any }) => void) => {
    const srcDir = joyConfig.resolveAppDir("src");
    let res: string;
    try {
      res = resolveRequest(request as string, `${context}/`);
    } catch (err) {
      // If the request cannot be resolved, we need to tell webpack to
      // "bundle" it so that webpack shows an error (that it cannot be
      // resolved).
      return callback();
    }
    // Out of src directory should not be bundled.
    if (!res.startsWith(srcDir)) {
      return callback(undefined, `commonjs ${request}`);
    }

    return callback();
  };

  // srcConfig.plugins = [...(serverConfig.plugins || []), new EmitSrcPlugin({ path: path.join(distDir, "dist") })];
  srcConfig.plugins = [...(serverConfig.plugins || []), new EmitSrcWebpackPlugin({ path: "dist" })];

  const cache: any = { ...(srcConfig.cache as any) };
  cache.cacheDirectory = path.join(cache.cacheDirectory, "../", "webpack-src");
  srcConfig.cache = cache;

  return srcConfig;
}
