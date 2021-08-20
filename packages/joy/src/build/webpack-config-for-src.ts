import webpack from "webpack";
import { stringify } from "querystring";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { EmitSrcPlugin } from "./webpack/plugins/emit-src-plugin/emit-src-plugin";
import path from "path";
import { resolveRequest } from "../lib/resolve-request";

export async function getWebpackConfigForSrc(serverConfig: webpack.Configuration, joyConfig: JoyAppConfig): Promise<webpack.Configuration> {
  const srcConfig = { ...serverConfig };
  const distDir = joyConfig.resolveAppDir(joyConfig.distDir);

  const srcDir = joyConfig.resolveAppDir("src");
  srcConfig.entry = {
    "src-bundle": [`joy-require-context-loader?${stringify({ absolutePath: srcDir })}!`],
  };

  const outputPath = path.join(distDir);
  srcConfig.output = {
    path: outputPath,
    filename: "[name].js",
  };

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

  srcConfig.plugins = [...(serverConfig.plugins || []), new EmitSrcPlugin({ path: path.join(distDir, "dist") })];

  const cache: any = { ...(srcConfig.cache as any) };
  cache.cacheDirectory = path.join(cache.cacheDirectory, "../", "webpack-src");
  srcConfig.cache = cache;

  return srcConfig;
}
