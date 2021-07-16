import webpack from "webpack";
import { stringify } from "querystring";
import { JoyAppConfig } from "../joy-server/server/joy-config/joy-app-config";
import { EmitSrcPlugin } from "./webpack/plugins/emit-src-plugin/emit-src-plugin";
import path from "path";

export async function getWebpackConfigForSrc(
  serverConfig: webpack.Configuration,
  joyConfig: JoyAppConfig
): Promise<webpack.Configuration> {
  const srcConfig = { ...serverConfig };
  const distDir = joyConfig.resolveAppDir(joyConfig.distDir);

  const srcDir = joyConfig.resolveAppDir("src");
  srcConfig.entry = {
    "src-bundle": [
      `joy-require-context-loader?${stringify({ absolutePath: srcDir })}!`,
    ],
  };

  const outputPath = path.join(distDir);
  srcConfig.output = {
    path: outputPath,
    filename: "[name].js",
  };

  srcConfig.plugins = [
    ...(serverConfig.plugins || []),
    new EmitSrcPlugin({ path: path.join(distDir, "dist") }),
  ];

  const cache: any = { ...(srcConfig.cache as any) };
  cache.cacheDirectory = path.join(cache.cacheDirectory, "../", "webpack-src");
  srcConfig.cache = cache;

  return srcConfig;
}
