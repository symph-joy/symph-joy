import isWslBoolean from "is-wsl";
import curry from "lodash.curry";
import webpack, { Configuration } from "webpack";
import { ConfigurationContext } from "../utils";

const isWindows = process.platform === "win32" || isWslBoolean;

export const base = curry(function base(ctx: ConfigurationContext, config: Configuration) {
  config.mode = ctx.isDevelopment ? "development" : "production";
  config.name = ctx.isServer ? "server" : "client";
  config.target = ctx.isServer ? "node12.22" : ["web", "es5"];

  // Stop compilation early in a production build when an error is encountered.
  // This behavior isn't desirable in development due to how the HMR system
  // works, but is a good default for production.
  config.bail = ctx.isProduction;

  // https://webpack.js.org/configuration/devtool/#development
  if (ctx.isDevelopment) {
    if (process.env.__JOY_TEST_MODE && !process.env.__JOY_TEST_WITH_DEVTOOL) {
      config.devtool = false;
    }
    // else if (isWindows) {
    //   // Non-eval based source maps are slow to rebuild, so we only enable
    //   // them for Windows. Unfortunately, eval source maps are flagged as
    //   // suspicious by Windows Defender and block HMR.
    //   config.devtool = "inline-source-map";
    // }
    else {
      // `eval-source-map` provides full-fidelity source maps for the
      // original source, including columns and original variable names.
      // This is desirable so the in-browser debugger can correctly pause
      // and show scoped variables with their original names.
      // config.devtool = "eval-source-map";
      if (ctx.isClient) {
        config.devtool = false;

        config.plugins?.push(
          new webpack.EvalSourceMapDevToolPlugin({
            test: /\.(tsx|ts|js|mjs|jsx)$/,
            // test: [/\.jsx?$/, /\.tsx?$/],
            exclude: [/node_modules/, "@symph/joy/dist", "@symph/react/dist", "@symph/core/dist"],
          })
        );
        config.module?.rules?.unshift({
          // test: ".{js,jsx,ts,tsx}",
          test: /\.(tsx|ts|js|mjs|jsx)$/,
          // exclude: ["node_modules"],
          enforce: "pre",
          use: [
            {
              loader: "source-map-loader",
              options: {
                filterSourceMappingUrl: (url: string, resourcePath: string) => {
                  if (/[\\/]node_modules[\\/]/i.test(resourcePath)) {
                    return false;
                  }
                  return true;
                },
              },
            },
          ],
        });
      } else {
        config.devtool = "eval-source-map";
      }
    }
  } else {
    // Enable browser sourcemaps:
    if (ctx.productionBrowserSourceMaps && ctx.isClient) {
      config.devtool = "source-map";
    } else {
      config.devtool = false;
    }
  }

  if (!config.module) {
    config.module = { rules: [] };
  }

  // TODO: add codemod for "Should not import the named export" with JSON files
  // config.module.strictExportPresence = !isWebpack5

  return config;
});
