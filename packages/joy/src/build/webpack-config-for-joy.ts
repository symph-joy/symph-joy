import webpack from "webpack";
import { stringify } from "querystring";
import { JoyAppConfig } from "../joy-server/server/joy-config/joy-app-config";
import path from "path";

export async function getWebpackConfigForJoy(
  serverConfig: webpack.Configuration,
  joyConfig: JoyAppConfig
): Promise<webpack.Configuration> {
  const srcConfig = { ...serverConfig };
  const distDir = joyConfig.resolveBuildOutDir("joy");

  const srcDir = joyConfig.resolveAutoGenOutDir("joy");
  srcConfig.entry = {
    "joy-bundle": [
      `joy-require-context-loader?${stringify({
        absolutePath: srcDir,
        useFileScan: true,
      })}!`,
    ],
  };

  srcConfig.output = {
    path: distDir,
    filename: "[name].js",
    libraryTarget: "commonjs2",
  };

  srcConfig.plugins = [...(serverConfig.plugins || [])];

  const cache: any = { ...(srcConfig.cache as any) };
  cache.cacheDirectory = path.join(cache.cacheDirectory, "../", "webpack-api");
  srcConfig.cache = cache;

  return srcConfig;
}
