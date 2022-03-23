import webpack from "webpack";
import { stringify } from "querystring";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import path from "path";
import { resolveRequest } from "../lib/resolve-request";

export async function getWebpackConfigForApi(serverConfig: webpack.Configuration, joyConfig: JoyAppConfig): Promise<webpack.Configuration> {
  const apiConfig = { ...serverConfig };
  const distDir = joyConfig.resolveBuildOutDir("joy");

  const srcDir = joyConfig.resolveAutoGenOutDir("joy");
  apiConfig.entry = {
    "server-bundle": [
      require.resolve("../server/dev/poll"),
      `joy-require-context-loader?${stringify({
        absolutePath: srcDir,
        useFileScan: true,
      })}!`,
    ],
  };
  apiConfig.externalsPresets = { node: true };
  apiConfig.target = "node12.22";
  apiConfig.externals = [
    ({ context, request }, callback) => {
      let res: string;
      try {
        res = resolveRequest(request || "", `${context}/`);
      } catch (err) {
        // If the request cannot be resolved, we need to tell webpack to
        // "bundle" it so that webpack shows an error (that it cannot be
        // resolved).
        return callback();
      }

      // Same as above, if the request cannot be resolved we need to have
      // webpack "bundle" it so it surfaces the not found error.
      if (!res) {
        return callback();
      }
      if (/joy[/\\]dist[/\\]server[/\\]dev[/\\]poll/.test(res)) {
        return callback();
      }

      // if (res === require.resolve('../server/dev/poll')){
      //   return callback()
      //     }

      // Webpack itself has to be compiled because it doesn't always use module relative paths
      if (res.match(/node_modules[/\\]webpack/) || res.match(/node_modules[/\\]css-loader/)) {
        return callback();
      }

      if (res.match(/node_modules[/\\].*\.[c]?js$/)) {
        return callback(undefined, `commonjs ${request}`);
      }

      // Anything else that is standard JavaScript within `node_modules`
      // can be externalized.
      if (
        res.match(/@symph[/\\].*\.js$/) ||
        res.match(/packages[/\\]joy[/\\]dist[/\\]/) ||
        res.match(/packages[/\\]core[/\\]dist[/\\]/) ||
        res.match(/packages[/\\]react[/\\]dist[/\\]/) ||
        res.match(/packages[/\\]server[/\\]dist[/\\]/) ||
        res.match(/packages[/\\]config[/\\]dist[/\\]/)
      ) {
        return callback(undefined, `commonjs ${request}`);
      }

      return callback();
    },
  ];

  // apiConfig.externals =[]

  apiConfig.output = {
    path: distDir,
    filename: "[name].js",
    libraryTarget: "commonjs2",
  };

  apiConfig.plugins = [...(serverConfig.plugins || [])];
  apiConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

  const cache: any = { ...(apiConfig.cache as any) };
  cache.cacheDirectory = path.join(cache.cacheDirectory, "../", "webpack-api");
  apiConfig.cache = cache;

  return apiConfig;
}
