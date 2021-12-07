import { codeFrameColumns } from "@babel/code-frame";
import ReactRefreshWebpackPlugin from "@next/react-refresh-utils/ReactRefreshWebpackPlugin";
import crypto from "crypto";
import { existsSync, readFileSync } from "fs";
import chalk from "chalk";
import TerserPlugin from "terser-webpack-plugin";
import path from "path";
import webpack, { Chunk, RuleSetRule } from "webpack";
import type { Configuration } from "webpack";
import { DOT_JOY_ALIAS, JOY_PROJECT_ROOT, JOY_PROJECT_ROOT_DIST_CLIENT, PAGES_DIR_ALIAS } from "../lib/constants";
import { fileExists } from "../lib/file-exists";
import { resolveRequest } from "../lib/resolve-request";
import { getTypeScriptConfiguration } from "../lib/typescript/getTypeScriptConfiguration";
import {
  CLIENT_STATIC_FILES_RUNTIME_MAIN,
  CLIENT_STATIC_FILES_RUNTIME_POLYFILLS,
  CLIENT_STATIC_FILES_RUNTIME_WEBPACK,
  REACT_LOADABLE_MANIFEST,
  SERVERLESS_DIRECTORY,
  SERVER_DIRECTORY,
} from "../joy-server/lib/constants";
import { execOnce } from "../joy-server/lib/utils";
import { findPageFile } from "../server/lib/find-page-file";
import { WebpackEntrypoints } from "./entries";
import * as Log from "./output/log";
import { collectPlugins, PluginMetaData, VALID_MIDDLEWARE } from "./plugins/collect-plugins";
import { build as buildConfiguration } from "./webpack/config";
import { __overrideCssConfiguration } from "./webpack/config/blocks/css/overrideCssConfiguration";
import { pluginLoaderOptions } from "./webpack/loaders/joy-plugin-loader";
import BuildManifestPlugin from "./webpack/plugins/build-manifest-plugin";
import ChunkNamesPlugin from "./webpack/plugins/chunk-names-plugin";
import { CssMinimizerPlugin } from "./webpack/plugins/css-minimizer-plugin";
import { JsConfigPathsPlugin } from "./webpack/plugins/jsconfig-paths-plugin";
import { DropClientPage } from "./webpack/plugins/joy-drop-client-page-plugin";
import JoyJsSsrImportPlugin from "./webpack/plugins/joyjs-ssr-import";
import JoyJsSSRModuleCachePlugin from "./webpack/plugins/joyjs-ssr-module-cache";
import PagesManifestPlugin from "./webpack/plugins/pages-manifest-plugin";
import { ProfilingPlugin } from "./webpack/plugins/profiling-plugin";
import { ReactLoadablePlugin } from "./webpack/plugins/react-loadable-plugin";
import { ServerlessPlugin } from "./webpack/plugins/serverless-plugin";
import WebpackConformancePlugin, {
  DuplicatePolyfillsConformanceCheck,
  GranularChunksConformanceCheck,
  MinificationConformanceCheck,
  ReactSyncScriptsConformanceCheck,
} from "./webpack/plugins/webpack-conformance-plugin";
import { WellKnownErrorsPlugin } from "./webpack/plugins/wellknown-errors-plugin";
import { Rewrite } from "../lib/load-custom-routes";
import { webpack5 } from "../types/webpack5";
import OptimizationSplitChunksOptions = webpack5.OptimizationSplitChunksOptions;
import { stringify } from "querystring";
import { IJoyReactRouteBuild } from "../react/router/joy-react-router-plugin";
import { REACT_OUT_DIR } from "../react/react-const";
import { Span } from "../trace";
type ExcludesFalse = <T>(x: T | false) => x is T;

const isWebpack5 = parseInt(webpack.version!) === 5;

export const joyImageLoaderRegex = /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i;

const escapePathVariables = (value: any) => {
  return typeof value === "string" ? value.replace(/\[(\\*[\w:]+\\*)\]/gi, "[\\$1\\]") : value;
};

const devtoolRevertWarning = execOnce((devtool: Configuration["devtool"]) => {
  console.warn(
    chalk.yellow.bold("Warning: ") +
      chalk.bold(`Reverting webpack devtool to '${devtool}'.\n`) +
      "Changing the webpack devtool in development mode will cause severe performance regressions."
  );
});

function parseJsonFile(filePath: string) {
  const JSON5 = require("json5");
  const contents = readFileSync(filePath, "utf8");

  // Special case an empty file
  if (contents.trim() === "") {
    return {};
  }

  try {
    return JSON5.parse(contents);
  } catch (err) {
    const codeFrame = codeFrameColumns(
      String(contents),
      { start: { line: err.lineNumber, column: err.columnNumber } },
      { message: err.message, highlightCode: true }
    );
    throw new Error(`Failed to parse "${filePath}":\n${codeFrame}`);
  }
}

function getOptimizedAliases(isServer: boolean): { [pkg: string]: string } {
  if (isServer) {
    return {};
  }

  const stubWindowFetch = path.join(__dirname, "polyfills", "fetch", "index.js");
  const stubObjectAssign = path.join(__dirname, "polyfills", "object-assign.js");

  const shimAssign = path.join(__dirname, "polyfills", "object.assign");
  return Object.assign(
    {},
    {
      unfetch$: stubWindowFetch,
      "isomorphic-unfetch$": stubWindowFetch,
      "whatwg-fetch$": path.join(__dirname, "polyfills", "fetch", "whatwg-fetch.js"),
    },
    {
      "object-assign$": stubObjectAssign,

      // Stub Package: object.assign
      "object.assign/auto": path.join(shimAssign, "auto.js"),
      "object.assign/implementation": path.join(shimAssign, "implementation.js"),
      "object.assign$": path.join(shimAssign, "index.js"),
      "object.assign/polyfill": path.join(shimAssign, "polyfill.js"),
      "object.assign/shim": path.join(shimAssign, "shim.js"),

      // Replace: full URL polyfill with platform-based polyfill
      url: require.resolve("native-url"),
    }
  );
}

type ClientEntries = {
  [key: string]: string | string[];
};

export function attachReactRefresh(webpackConfig: webpack.Configuration, targetLoader: webpack.RuleSetUseItem) {
  let injections = 0;
  const reactRefreshLoaderName = "@next/react-refresh-utils/loader";
  const reactRefreshLoader = require.resolve(reactRefreshLoaderName);
  webpackConfig.module?.rules?.forEach((rule: any) => {
    const curr = rule.use;
    // When the user has configured `defaultLoaders.babel` for a input file:
    if (curr === targetLoader) {
      ++injections;
      rule.use = [reactRefreshLoader, curr as webpack.RuleSetUseItem];
    } else if (
      Array.isArray(curr) &&
      curr.some((r) => r === targetLoader) &&
      // Check if loader already exists:
      !curr.some((r) => r === reactRefreshLoader || r === reactRefreshLoaderName)
    ) {
      ++injections;
      const idx = curr.findIndex((r) => r === targetLoader);
      // Clone to not mutate user input
      rule.use = [...curr];

      // inject / input: [other, babel] output: [other, refresh, babel]:
      rule.use.splice(idx, 0, reactRefreshLoader);
    }
  });

  if (injections) {
    Log.info(`automatically enabled Fast Refresh for ${injections} custom loader${injections > 1 ? "s" : ""}`);
  }
}

export default async function getBaseWebpackConfig(
  dir: string,
  {
    buildId,
    config,
    dev = false,
    isServer = false,
    pagesDir,
    target = "server",
    reactProductionProfiling = false,
    entrypoints,
    rewrites,
    routes,
    runWebpackSpan,
  }: {
    buildId: string;
    config: any;
    dev?: boolean;
    isServer?: boolean;
    pagesDir: string;
    target?: string;
    reactProductionProfiling?: boolean;
    entrypoints: WebpackEntrypoints;
    rewrites: Rewrite[];
    routes?: IJoyReactRouteBuild[] | (() => IJoyReactRouteBuild[]);
    runWebpackSpan?: Span;
  }
): Promise<webpack.Configuration> {
  const productionBrowserSourceMaps = config.experimental.productionBrowserSourceMaps && !isServer;
  let plugins: PluginMetaData[] = [];
  const babelPresetPlugins: { dir: string; config: any }[] = [];

  const hasRewrites = rewrites.length > 0 || dev;

  if (config.experimental.plugins) {
    plugins = await collectPlugins(dir, config.env, config.plugins);
    pluginLoaderOptions.plugins = plugins;

    for (const plugin of plugins) {
      if (plugin.middleware.includes("babel-preset-build")) {
        babelPresetPlugins.push({
          dir: plugin.directory,
          config: plugin.config,
        });
      }
    }
  }

  const hasReactRefresh = dev && !isServer;
  const distDir = path.join(dir, config.distDir);
  const defaultLoaders = {
    babel: {
      loader: "joy-babel-loader",
      options: {
        isServer,
        distDir,
        pagesDir,
        cwd: dir,
        // Webpack 5 has a built-in loader cache
        cache: !isWebpack5,
        babelPresetPlugins,
        hasModern: !!config.experimental.modern,
        development: dev,
        hasReactRefresh,
      },
    },
  };

  const babelIncludeRegexes: RegExp[] = [
    /joy[\\/]dist[\\/]joy-server[\\/]lib/,
    /joy[\\/]dist[\\/]client/,
    /joy[\\/]dist[\\/]pages/,
    // TODO 在浏览器端，如何较少这部分编译？当前的问题，如果不再次编译，那么子类被转换为ES5后，父类将不能正常初始化，报错： Class constructor cannot be invoked without 'new'
    /core[\\/]dist[\\/]/,
    /react[\\/]dist[\\/]/,
    /config[\\/]dist[\\/]/,
    /joy[\\/]dist[\\/]/,
    /[\\/](strip-ansi|ansi-regex)[\\/]/,
    ...(config.experimental.plugins ? VALID_MIDDLEWARE.map((name) => new RegExp(`src(\\\\|/)${name}`)) : []),
  ];

  // Support for NODE_PATH
  const nodePathList = (process.env.NODE_PATH || "").split(process.platform === "win32" ? ";" : ":").filter((p) => !!p);

  const isServerless = target === "serverless";
  const isServerlessTrace = target === "experimental-serverless-trace";
  // Intentionally not using isTargetLikeServerless helper
  const isLikeServerless = isServerless || isServerlessTrace;

  const outputDir = isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY;
  const outputPath = path.join(distDir, REACT_OUT_DIR, isServer ? outputDir : "");
  const totalPages = Object.keys(entrypoints).length;
  // const autoGenServerModulesFile = path.join(
  //   distDir,
  //   config.autoGenOutputDir,
  //   "./gen-server-modules.js"
  // );
  // const autoGenClientModulesFile = path.join(
  //   distDir,
  //   config.autoGenOutputDir,
  //   "./gen-client-modules.js"
  // );
  const autoGenClientOutputAbsDir = path.join(distDir, config.autoGenOutputDir, "react/client");
  const autoGenServerOutputAbsDir = path.join(distDir, config.autoGenOutputDir, "react/server");

  const clientEntries = !isServer
    ? () =>
        ({
          // 'genFiles': `joy-client-generate-file-loader?${stringify(
          //   {absolutePath: path.join(dir, '.genFiles')} // todo set dir from config
          // )}!`,
          [CLIENT_STATIC_FILES_RUNTIME_MAIN]: [
            // `./` + path.relative(dir, path.join(JOY_PROJECT_ROOT_DIST_CLIENT, dev ? `joy-dev.js` : 'joy.js')).replace(/\\/g, '/'),
            // existsSync(autoGenOutputAbsDir) ? `joy-client-generate-file-loader?${stringify(
            //   {absolutePath: autoGenOutputAbsDir}
            // )}!` : undefined,
            // existsSync(autoGenClientModulesFile)
            //   ? autoGenClientModulesFile
            //   : undefined,
            existsSync(autoGenClientOutputAbsDir)
              ? `joy-require-context-loader?${stringify({
                  absolutePath: autoGenClientOutputAbsDir,
                  globalVar: "window",
                  globalKey: "__JOY_AUTOGEN",
                  useFileScan: true,
                })}!`
              : undefined,
            require.resolve(dev ? `../client/joy-dev` : "../client/joy").replace(/\\/g, "/"),
          ].filter(Boolean),
          [CLIENT_STATIC_FILES_RUNTIME_POLYFILLS]: path.join(JOY_PROJECT_ROOT_DIST_CLIENT, "polyfills.js"),
        } as ClientEntries)
    : undefined;
  const serverEntries = isServer
    ? () => ({
        "gen-server-modules": [
          // existsSync(autoGenServerModulesFile)
          //   ? autoGenServerModulesFile
          //   : undefined,
          existsSync(autoGenServerOutputAbsDir)
            ? `joy-require-context-loader?${stringify({
                absolutePath: autoGenServerOutputAbsDir,
                useFileScan: true,
              })}!`
            : undefined,
        ].filter(Boolean) as string[],
        // 'joy-gen-entry': [],
      })
    : undefined;

  let typeScriptPath: string | undefined;
  try {
    typeScriptPath = resolveRequest("typescript", `${dir}/`);
  } catch (_) {}
  const tsConfigPath = path.join(dir, "tsconfig.json");
  const useTypeScript = Boolean(typeScriptPath && (await fileExists(tsConfigPath)));

  let jsConfig;
  // jsconfig is a subset of tsconfig
  if (useTypeScript) {
    const ts = (await import(typeScriptPath!)) as typeof import("typescript");
    const tsConfig = await getTypeScriptConfiguration(ts, tsConfigPath);
    jsConfig = { compilerOptions: tsConfig.options };
  }

  const jsConfigPath = path.join(dir, "jsconfig.json");
  if (!useTypeScript && (await fileExists(jsConfigPath))) {
    jsConfig = parseJsonFile(jsConfigPath);
  }

  let resolvedBaseUrl;
  if (jsConfig?.compilerOptions?.baseUrl) {
    resolvedBaseUrl = path.resolve(dir, jsConfig.compilerOptions.baseUrl);
  }

  function getReactProfilingInProduction() {
    if (reactProductionProfiling) {
      return {
        "react-dom$": "react-dom/profiling",
        "scheduler/tracing": "scheduler/tracing-profiling",
      };
    }
  }

  const clientResolveRewrites = require.resolve("../joy-server/lib/router/utils/resolve-rewrites");

  const resolveConfig = {
    // Disable .mjs for node_modules bundling
    extensions: isServer
      ? [".js", ".mjs", ...(useTypeScript ? [".tsx", ".ts"] : []), ".jsx", ".json", ".wasm"]
      : [".mjs", ".js", ...(useTypeScript ? [".tsx", ".ts"] : []), ".jsx", ".json", ".wasm"],
    modules: [
      "node_modules",
      ...nodePathList, // Support for NODE_PATH environment variable
    ],
    alias: {
      // These aliases make sure the wrapper module is not included in the bundles
      // Which makes bundles slightly smaller, but also skips parsing a module that we know will result in this alias
      "joy/head": require.resolve("../joy-server/lib/head"),
      "@symph/joy/router": require.resolve("../client/router"),
      "joy/config": require.resolve("../joy-server/lib/runtime-config"),
      "joy/dynamic": require.resolve("../joy-server/lib/dynamic"),
      joy: JOY_PROJECT_ROOT,
      ...(isWebpack5 && !isServer
        ? {
            stream: require.resolve("stream-browserify"),
            path: require.resolve("path-browserify"),
            crypto: require.resolve("crypto-browserify"),
            buffer: require.resolve("buffer"),
            vm: require.resolve("vm-browserify"),
          }
        : undefined),
      [PAGES_DIR_ALIAS]: pagesDir,
      [DOT_JOY_ALIAS]: distDir,
      ...getOptimizedAliases(isServer),
      ...getReactProfilingInProduction(),
      [clientResolveRewrites]: hasRewrites ? clientResolveRewrites : require.resolve("../client/dev/noop.js"),
    },
    mainFields: isServer ? ["main", "module"] : ["browser", "module", "main"],
    plugins: isWebpack5
      ? // webpack 5+ has the PnP resolver built-in by default:
        []
      : [require("pnp-webpack-plugin")],
  };

  const webpackMode = dev ? "development" : "production";

  const terserOptions: any = {
    keep_classnames: true,
    keep_fnames: true,
    parse: {
      ecma: 8,
    },
    compress: {
      ecma: 5,
      warnings: false,
      // The following two options are known to break valid JavaScript code
      comparisons: false,
      inline: 2,
    },
    mangle: { safari10: true },
    output: {
      ecma: 5,
      safari10: true,
      comments: false,
      // Fixes usage of Emoji and certain Regex
      ascii_only: true,
    },
  };

  const isModuleCSS = (module: { type: string }): boolean => {
    return (
      // mini-css-extract-plugin
      module.type === `css/mini-extract` ||
      // extract-css-chunks-webpack-plugin (old)
      module.type === `css/extract-chunks` ||
      // extract-css-chunks-webpack-plugin (new)
      module.type === `css/extract-css-chunks`
    );
  };

  // Contains various versions of the Webpack SplitChunksPlugin used in different build types

  const splitChunksConfigs: {
    [propName: string]: OptimizationSplitChunksOptions;
  } = {
    dev: {
      cacheGroups: {
        default: false,
        vendors: false,
        // In webpack 5 vendors was renamed to defaultVendors
        defaultVendors: false,
      },
    },
    prodGranular: {
      chunks: "all",
      cacheGroups: {
        default: false,
        vendors: false,
        // In webpack 5 vendors was renamed to defaultVendors
        defaultVendors: false,
        framework: {
          chunks: "all",
          name: "framework",
          // This regex ignores nested copies of framework libraries so they're
          // bundled with their issuer.
          test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
          priority: 40,
          // Don't let webpack eliminate this chunk (prevents this chunk from
          // becoming a part of the commons chunk)
          enforce: true,
        },
        lib: {
          test(module: { size: Function; identifier: Function }): boolean {
            return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
          },
          name(module: { type: string; libIdent?: Function; updateHash: (hash: crypto.Hash) => void }): string {
            const hash = crypto.createHash("sha1");
            if (isModuleCSS(module)) {
              module.updateHash(hash);
            } else {
              if (!module.libIdent) {
                throw new Error(`Encountered unknown module type: ${module.type}. Please open an issue.`);
              }

              hash.update(module.libIdent({ context: dir }));
            }

            return "lib-" + hash.digest("hex").substring(0, 8);
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        commons: {
          name: "commons",
          minChunks: totalPages,
          priority: 20,
        },
        shared: {
          name(module: any, chunks: any) {
            return (
              crypto
                .createHash("sha1")
                .update(
                  chunks.reduce((acc: string, chunk: Chunk) => {
                    return acc + chunk.name;
                  }, "")
                )
                .digest("hex") + (isModuleCSS(module) ? "_CSS" : "")
            );
          },
          priority: 10,
          minChunks: 2,
          reuseExistingChunk: true,
        },
      },
      maxInitialRequests: 25,
      minSize: 20000,
    },
  };

  // Select appropriate SplitChunksPlugin config for this build
  let splitChunksConfig: OptimizationSplitChunksOptions;
  if (dev) {
    splitChunksConfig = splitChunksConfigs.dev;
  } else {
    splitChunksConfig = splitChunksConfigs.prodGranular;
  }

  const crossOrigin = !config.crossOrigin && config.experimental.modern ? "anonymous" : config.crossOrigin;

  let customAppFile: string | null = await findPageFile(pagesDir, "/_app", config.pageExtensions);
  if (customAppFile) {
    customAppFile = path.resolve(path.join(pagesDir, customAppFile));
  }

  const conformanceConfig = Object.assign(
    {
      ReactSyncScriptsConformanceCheck: {
        enabled: true,
      },
      MinificationConformanceCheck: {
        enabled: true,
      },
      DuplicatePolyfillsConformanceCheck: {
        enabled: true,
        BlockedAPIToBePolyfilled: Object.assign(
          [],
          ["fetch"],
          config.conformance?.DuplicatePolyfillsConformanceCheck?.BlockedAPIToBePolyfilled || []
        ),
      },
      GranularChunksConformanceCheck: {
        enabled: true,
      },
    },
    config.conformance
  );

  function handleServerExternals(context: any, request: any, callback: any) {
    // Resolve the import with the webpack provided context, this
    // ensures we're resolving the correct version when multiple
    // exist.
    let res: string;
    try {
      res = resolveRequest(request, `${context}/`);
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

    // Anything else that is standard JavaScript within `node_modules`
    // can be externalized.
    if (res.match(/node_modules[/\\].*\.js$/)) {
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
  }

  /**
   * 将废弃掉，逐步采用handleServerExternals方法替换。
   * @param context
   * @param request
   * @param callback
   */
  function handleExternals(context: any, request: any, callback: any) {
    // return     callback()
    return callback(undefined, `commonjs ${request}`);
    if (request.includes("joy-fetch.service")) {
      console.log(request);
    }
    if (request === "@symph/joy") {
      return callback(undefined, `commonjs ${request}`);
    }
    if (request === "@symph/joy/dist/index-server") {
      return callback(undefined, `commonjs ${request}`);
    }
    if (request === "@symph/joy/dist/react/service/joy-fetch.service") {
      return callback(undefined, `commonjs ${request}`);
    }

    if (request === "@symph/core") {
      return callback(undefined, `commonjs ${request}`);
    }

    if (request === "@symph/react") {
      return callback(undefined, `commonjs ${request}`);
    }

    if (request === "@symph/server") {
      return callback(undefined, `commonjs ${request}`);
    }

    // todo 适配es module的导出方式
    const notExternalModules = ["joy/app", "joy/document", "joy/link", "joy/error", "string-hash", "joy/constants"];

    if (notExternalModules.indexOf(request) !== -1) {
      return callback();
    }

    // We need to externalize internal requests for files intended to
    // not be bundled.

    const isLocal: boolean =
      request.startsWith(".") ||
      // Always check for unix-style path, as webpack sometimes
      // normalizes as posix.
      path.posix.isAbsolute(request) ||
      // When on Windows, we also want to check for Windows-specific
      // absolute paths.
      (process.platform === "win32" && path.win32.isAbsolute(request));
    const isLikelyJoyExternal = isLocal && /[/\\]joy-server[/\\]/.test(request);

    // Relative requires don't need custom resolution, because they
    // are relative to requests we've already resolved here.
    // Absolute requires (require('/foo')) are extremely uncommon, but
    // also have no need for customization as they're already resolved.
    if (isLocal && !isLikelyJoyExternal) {
      return callback();
    }

    // Resolve the import with the webpack provided context, this
    // ensures we're resolving the correct version when multiple
    // exist.
    let res: string;
    try {
      res = resolveRequest(request, `${context}/`);
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

    let isJoyExternal = false;
    if (isLocal) {
      // we need to process joy-server/lib/router/router so that
      // the DefinePlugin can inject process.env values
      // isJoyExternal = /joy([/\\]dist)?[/\\]joy-server[/\\](?!lib[/\\]router[/\\]router)/.test(
      isJoyExternal = /joy[/\\]dist[/\\]joy-server[/\\](?!lib[/\\]router[/\\]router)/.test(res);

      if (!isJoyExternal) {
        return callback();
      }
    }

    // `isJoyExternal` special cases Joy.js' internal requires that
    // should not be bundled. We need to skip the base resolve routine
    // to prevent it from being bundled (assumes Joy version cannot
    // mismatch).
    if (!isJoyExternal) {
      // Bundled Node.js code is relocated without its node_modules tree.
      // This means we need to make sure its request resolves to the same
      // package that'll be available at runtime. If it's not identical,
      // we need to bundle the code (even if it _should_ be external).
      let baseRes: string | null;
      try {
        baseRes = resolveRequest(request, `${dir}/`);
      } catch (err) {
        baseRes = null;
      }

      // Same as above: if the package, when required from the root,
      // would be different from what the real resolution would use, we
      // cannot externalize it.
      if (baseRes !== res) {
        return callback();
      }
    }

    // Default pages have to be transpiled
    if (
      !res.match(/joy[/\\]dist[/\\]joy-server[/\\]/) &&
      (res.match(/[/\\]joy[/\\]dist[/\\]/) ||
        // This is the @babel/plugin-transform-runtime "helpers: true" option
        res.match(/node_modules[/\\]@babel[/\\]runtime[/\\]/))
    ) {
      return callback();
    }

    // Webpack itself has to be compiled because it doesn't always use module relative paths
    if (res.match(/node_modules[/\\]webpack/) || res.match(/node_modules[/\\]css-loader/)) {
      return callback();
    }

    // Anything else that is standard JavaScript within `node_modules`
    // can be externalized.
    if (isJoyExternal || res.match(/node_modules[/\\].*\.js$/)) {
      const externalRequest = isJoyExternal
        ? // Generate Joy external import
          path.posix.join(
            "@symph/joy/dist/",
            path
              .relative(
                // Root of Joy package:
                path.join(__dirname, ".."),
                res
              )
              // Windows path normalization
              .replace(/\\/g, "/")
          )
        : request;

      return callback(undefined, `commonjs ${externalRequest}`);
    }

    // Default behavior: bundle the code!
    callback();
  }

  let webpackConfig: webpack.Configuration = {
    externals: !isServer
      ? // make sure importing "@symph/joy" is handled gracefully for client
        // bundles in case a user imported types and it wasn't removed
        // TODO: should we warn/error for this instead?
        // ["@symph/joy"]
        []
      : !isServerless
      ? [({ context, request }, callback) => handleServerExternals(context, request, callback)]
      : [
          // When the 'serverless' target is used all node_modules will be compiled into the output bundles
          // So that the 'serverless' bundles have 0 runtime dependencies
          "@ampproject/toolbox-optimizer", // except this one
        ],
    optimization: {
      // Webpack 5 uses a new property for the same functionality
      ...(isWebpack5 ? { emitOnErrors: !dev } : { noEmitOnErrors: dev }),
      // checkWasmTypes: false,
      nodeEnv: false,
      splitChunks: isServer ? false : splitChunksConfig,
      runtimeChunk: isServer
        ? isWebpack5 && !isLikeServerless
          ? { name: "webpack-runtime" }
          : undefined
        : { name: CLIENT_STATIC_FILES_RUNTIME_WEBPACK },
      // minimize: !(dev || isServer),
      minimize: false,
      minimizer: [
        // Minify JavaScript
        new TerserPlugin({
          extractComments: false,
          // cache: path.join(outDir, 'cache', 'joy-minifier'), // webpack5 升级后不兼容，先屏蔽掉
          parallel: config.experimental.cpus || true,
          terserOptions,
        }),
        // Minify CSS
        new CssMinimizerPlugin({
          postcssOptions: {
            map: {
              // `inline: false` generates the source map in a separate file.
              // Otherwise, the CSS file is needlessly large.
              inline: false,
              // `annotation: false` skips appending the `sourceMappingURL`
              // to the end of the CSS file. Webpack already handles this.
              annotation: false,
            },
          },
        }),
      ],
    },
    context: dir,
    // node: {
    //   setImmediate: false,
    // },
    // Kept as function to be backwards compatible
    entry: async () => {
      return {
        ...(clientEntries ? clientEntries() : {}),
        ...(serverEntries ? serverEntries() : {}),
        ...entrypoints,
        ...(isServer
          ? {
              "init-server.js": "joy-plugin-loader?middleware=on-init-server!",
              "on-error-server.js": "joy-plugin-loader?middleware=on-error-server!",
            }
          : {}),
      };
    },
    watchOptions: {
      ignored: ["**/.git/**", "**/node_modules/**", "**/.joy/out/**", "**/.joy/dist/**"],
      aggregateTimeout: 500,
    },
    output: {
      // fixme
      // ...(isWebpack5 ? { ecmaVersion: 5 } : {}),
      path: outputPath,
      // On the server we don't use the chunkhash
      filename: isServer ? "[name].js" : `static/chunks/[name]${dev ? "" : "-[chunkhash]"}.js`,
      library: isServer ? undefined : "_N_E",
      libraryTarget: isServer ? "commonjs2" : "assign",
      hotUpdateChunkFilename: isWebpack5 ? "static/webpack/[id].[fullhash].hot-update.js" : "static/webpack/[id].[hash].hot-update.js",
      hotUpdateMainFilename: isWebpack5 ? "static/webpack/[fullhash].hot-update.json" : "static/webpack/[hash].hot-update.json",
      // This saves chunks with the name given via `import()`
      chunkFilename: isServer ? `${dev ? "[name]" : "[name].[contenthash]"}.js` : `static/chunks/${dev ? "[name]" : "[name].[contenthash]"}.js`,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      strictModuleExceptionHandling: true,
      crossOriginLoading: crossOrigin,
      // futureEmitAssets: !dev,
      webassemblyModuleFilename: "static/wasm/[modulehash].wasm",
    },
    performance: false,
    resolve: resolveConfig,
    resolveLoader: {
      // The loaders Joy provides
      alias: [
        "joy-client-generate-file-loader",
        "emit-file-loader",
        "error-loader",
        "joy-babel-loader",
        "joy-client-pages-loader",
        "joy-data-loader",
        "joy-serverless-loader",
        "noop-loader",
        "joy-plugin-loader",
        "joy-require-context-loader",
      ].reduce((alias, loader) => {
        // using multiple aliases to replace `resolveLoader.modules`
        if (process.env.NODE_ENV === "test") {
          alias[loader] = path.join(
            __dirname,
            "webpack",
            "loaders",
            ["joy-babel-loader", "emit-file-loader"].includes(loader) ? loader + ".js" : loader + ".ts"
          );
        } else {
          alias[loader] = path.join(__dirname, "webpack", "loaders", loader + ".js");
        }
        // alias[loader] = path.join(__dirname, 'webpack', 'loaders', ['joy-babel-loader', 'emit-file-loader' ].includes(loader) ? loader+'.js': loader+'.ts')
        // alias[loader] = path.join(__dirname, 'webpack', 'loaders',  loader + '.js')
        // alias[loader] = path.join(__dirname, 'webpack', 'loaders', loader)
        return alias;
      }, {} as Record<string, string>),
      modules: [
        "node_modules",
        ...nodePathList, // Support for NODE_PATH environment variable
      ],
      plugins: isWebpack5 ? [] : [require("pnp-webpack-plugin")],
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts|js|mjs|jsx)$/,
          include: [dir, ...babelIncludeRegexes],
          exclude: (excludePath: string) => {
            if (babelIncludeRegexes.some((r) => r.test(excludePath))) {
              return false;
            }
            return /node_modules/.test(excludePath);
          },
          use: config.experimental.babelMultiThread
            ? [
                // Move Babel transpilation into a thread pool (2 workers, unlimited batch size).
                // Applying a cache to the off-thread work avoids paying transfer costs for unchanged modules.
                {
                  loader: "cache-loader",
                  options: {
                    cacheContext: dir,
                    cacheDirectory: path.join(distDir, "cache", "webpack"),
                    cacheIdentifier: `webpack${isServer ? "-server" : ""}${config.experimental.modern ? "-hasmodern" : ""}`,
                  },
                },
                {
                  loader: require.resolve("thread-loader"),
                  options: {
                    workers: 2,
                    workerParallelJobs: Infinity,
                  },
                },
                hasReactRefresh ? require.resolve("@next/react-refresh-utils/loader") : "",
                defaultLoaders.babel,
              ].filter(Boolean)
            : hasReactRefresh
            ? [require.resolve("@next/react-refresh-utils/loader"), defaultLoaders.babel]
            : defaultLoaders.babel,
        },
      ].filter(Boolean),
    },
    plugins: [
      hasReactRefresh && new ReactRefreshWebpackPlugin(),
      // Makes sure `Buffer` is polyfilled in client-side bundles (same behavior as webpack 4)
      isWebpack5 && !isServer && new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
      // Makes sure `process` is polyfilled in client-side bundles (same behavior as webpack 4)
      isWebpack5 && !isServer && new webpack.ProvidePlugin({ process: ["process"] }),
      // This plugin makes sure `output.filename` is used for entry chunks
      !isWebpack5 && new ChunkNamesPlugin(),
      new webpack.DefinePlugin({
        ...Object.keys(process.env).reduce((prev: { [key: string]: string }, key: string) => {
          if (key.startsWith("JOY_PUBLIC_")) {
            prev[`process.env.${key}`] = JSON.stringify(process.env[key]!);
          }
          return prev;
        }, {}),
        ...Object.keys(config.env).reduce((acc, key) => {
          if (/^(?:NODE_.+)|^(?:__.+)$/i.test(key)) {
            throw new Error(`The key "${key}" under "env" in joy.config.js is not allowed.`);
          }

          return {
            ...acc,
            [`process.env.${key}`]: JSON.stringify(config.env[key]),
          };
        }, {}),
        "process.env.NODE_ENV": JSON.stringify(webpackMode),
        "process.env.__JOY_CROSS_ORIGIN": JSON.stringify(crossOrigin),
        "process.browser": JSON.stringify(!isServer),
        "process.env.__JOY_TEST_MODE": JSON.stringify(process.env.__JOY_TEST_MODE),
        // This is used in client/dev-error-overlay/hot-dev-client.js to replace the dist directory
        ...(dev && !isServer
          ? {
              "process.env.__JOY_DIST_DIR": JSON.stringify(distDir),
            }
          : {}),
        "process.env.__JOY_TRAILING_SLASH": JSON.stringify(config.trailingSlash),
        "process.env.__JOY_MODERN_BUILD": JSON.stringify(config.experimental.modern && !dev),
        "process.env.__JOY_BUILD_INDICATOR": JSON.stringify(config.devIndicators.buildActivity),
        "process.env.__JOY_PRERENDER_INDICATOR": JSON.stringify(config.devIndicators.autoPrerender),
        "process.env.__JOY_PLUGINS": JSON.stringify(config.experimental.plugins),
        "process.env.__JOY_STRICT_MODE": JSON.stringify(config.reactStrictMode),
        "process.env.__JOY_REACT_MODE": JSON.stringify(config.experimental.reactMode),
        "process.env.__JOY_OPTIMIZE_FONTS": JSON.stringify(config.experimental.optimizeFonts && !dev),
        "process.env.__JOY_OPTIMIZE_IMAGES": JSON.stringify(config.experimental.optimizeImages),
        "process.env.__JOY_SCROLL_RESTORATION": JSON.stringify(config.experimental.scrollRestoration),
        "process.env.__JOY_ROUTER_BASEPATH": JSON.stringify(config.basePath),
        "process.env.__JOY_HAS_REWRITES": JSON.stringify(hasRewrites),
        ...(isServer
          ? {
              // Fix bad-actors in the npm ecosystem (e.g. `node-formidable`)
              // This is typically found in unmaintained modules from the
              // pre-webpack era (common in server-side code)
              "global.GENTLY": JSON.stringify(false),
            }
          : undefined),
        // stub process.env with proxy to warn a missing value is
        // being accessed in development mode
        ...(config.experimental.pageEnv && process.env.NODE_ENV !== "production"
          ? {
              "process.env": `
            new Proxy(${isServer ? "process.env" : "{}"}, {
              get(target, prop) {
                if (typeof target[prop] === 'undefined') {
                  console.warn(\`An environment variable (\${prop}) that was not provided in the environment was accessed.\`)
                }
                return target[prop]
              }
            })
          `,
            }
          : {}),
      }),
      !isServer &&
        new ReactLoadablePlugin({
          filename: REACT_LOADABLE_MANIFEST,
        }),
      !isServer && new DropClientPage(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      config.future.excludeDefaultMomentLocales &&
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        }),
      ...(dev
        ? (() => {
            // Even though require.cache is server only we have to clear assets from both compilations
            // This is because the client compilation generates the build manifest that's used on the server side
            const { JoyjsRequireCacheHotReloader } = require("./webpack/plugins/joyjs-require-cache-hot-reloader");
            const devPlugins = [new JoyjsRequireCacheHotReloader()];

            if (!isServer) {
              devPlugins.push(new webpack.HotModuleReplacementPlugin());
            }

            return devPlugins;
          })()
        : []),
      // Webpack 5 no longer requires this plugin in production:
      // !isWebpack5 && !dev && new webpack.HashedModuleIdsPlugin(),

      // react-router内引用了react-is，导致该配置暂时无法使用。
      // !dev &&
      //   new webpack.IgnorePlugin({
      //     resourceRegExp: /react-is/,
      //     contextRegExp: /(joy-server|joy)[\\/]/,
      //   }),
      isServerless && isServer && new ServerlessPlugin(),
      isServer && new PagesManifestPlugin(isLikeServerless),
      !isWebpack5 && target === "server" && isServer && new JoyJsSSRModuleCachePlugin({ outputPath }),
      isServer && new JoyJsSsrImportPlugin(),
      !isServer &&
        new BuildManifestPlugin({
          buildId,
          rewrites,
          modern: config.experimental.modern,
          routes: routes || [],
        }),
      runWebpackSpan && new ProfilingPlugin({ runWebpackSpan }),
      !isWebpack5 &&
        config.experimental.modern &&
        !isServer &&
        !dev &&
        (() => {
          const { JoyEsmPlugin: JoyEsmPlugin } = require("./webpack/plugins/joy-esm-plugin");
          return new JoyEsmPlugin({
            filename: (getFileName: Function | string) => (...args: any[]) => {
              const name = typeof getFileName === "function" ? getFileName(...args) : getFileName;

              return name.includes(".js")
                ? name.replace(/\.js$/, ".module.js")
                : escapePathVariables(args[0].chunk.name.replace(/\.js$/, ".module.js"));
            },
            chunkFilename: (inputChunkName: string) => inputChunkName.replace(/\.js$/, ".module.js"),
          });
        })(),
      config.experimental.optimizeFonts &&
        !dev &&
        isServer &&
        (function () {
          const { FontStylesheetGatheringPlugin } = require("./webpack/plugins/font-stylesheet-gathering-plugin");
          return new FontStylesheetGatheringPlugin();
        })(),
      // config.experimental.conformance &&
      //   !isWebpack5 &&
      //   !dev &&
      //   new WebpackConformancePlugin({
      //     tests: [
      //       !isServer && conformanceConfig.MinificationConformanceCheck.enabled && new MinificationConformanceCheck(),
      //       conformanceConfig.ReactSyncScriptsConformanceCheck.enabled &&
      //         new ReactSyncScriptsConformanceCheck({
      //           AllowedSources: conformanceConfig.ReactSyncScriptsConformanceCheck.allowedSources || [],
      //         }),
      //       !isServer &&
      //         conformanceConfig.DuplicatePolyfillsConformanceCheck.enabled &&
      //         new DuplicatePolyfillsConformanceCheck({
      //           BlockedAPIToBePolyfilled: conformanceConfig.DuplicatePolyfillsConformanceCheck.BlockedAPIToBePolyfilled,
      //         }),
      //       !isServer &&
      //         conformanceConfig.GranularChunksConformanceCheck.enabled &&
      //         new GranularChunksConformanceCheck(splitChunksConfigs.prodGranular),
      //     ].filter(Boolean),
      //   }),
      new WellKnownErrorsPlugin(),
      // isServer && new EmitSrcPlugin({path: path.join(outDir, 'dist')})
    ].filter((Boolean as any) as ExcludesFalse),
  };

  // Support tsconfig and jsconfig baseUrl
  if (resolvedBaseUrl) {
    webpackConfig.resolve?.modules?.push(resolvedBaseUrl);
  }

  if (jsConfig?.compilerOptions?.paths && resolvedBaseUrl) {
    webpackConfig.resolve?.plugins?.unshift(new JsConfigPathsPlugin(jsConfig.compilerOptions.paths, resolvedBaseUrl));
  }

  if (isWebpack5) {
    // futureEmitAssets is on by default in webpack 5
    // delete webpackConfig.output?.futureEmitAssets
    // webpack 5 no longer polyfills Node.js modules:
    if (webpackConfig.node) {
      // @ts-ignore
      delete webpackConfig.node.setImmediate;
    }

    if (dev) {
      if (!webpackConfig.optimization) {
        webpackConfig.optimization = {};
      }
      webpackConfig.optimization.usedExports = false;
    }

    const joyPublicVariables = Object.keys(process.env).reduce((prev: string, key: string) => {
      if (key.startsWith("JOY_PUBLIC_")) {
        return `${prev}|${key}=${process.env[key]}`;
      }
      return prev;
    }, "");
    const joyEnvVariables = Object.keys(config.env).reduce((prev: string, key: string) => {
      return `${prev}|${key}=${config.env[key]}`;
    }, "");

    const configVars = JSON.stringify({
      crossOrigin: config.crossOrigin,
      pageExtensions: config.pageExtensions,
      trailingSlash: config.trailingSlash,
      modern: config.experimental.modern,
      buildActivity: config.devIndicators.buildActivity,
      autoPrerender: config.devIndicators.autoPrerender,
      plugins: config.experimental.plugins,
      reactStrictMode: config.reactStrictMode,
      reactMode: config.experimental.reactMode,
      optimizeFonts: config.experimental.optimizeFonts,
      optimizeImages: config.experimental.optimizeImages,
      scrollRestoration: config.experimental.scrollRestoration,
      basePath: config.basePath,
      pageEnv: config.experimental.pageEnv,
      excludeDefaultMomentLocales: config.future.excludeDefaultMomentLocales,
      assetPrefix: config.assetPrefix,
      target,
      reactProductionProfiling,
    });

    const cache: any = {
      type: "filesystem",
      // Includes:
      //  - Joy version
      //  - JOY_PUBLIC_ variable values (they affect caching) TODO: make this module usage only
      //  - joy.config.js `env` key
      //  - joy.config.js keys that affect compilation
      version: `${process.env.__JOY_VERSION}|${joyPublicVariables}|${joyEnvVariables}|${configVars}`,
      cacheDirectory: path.join(distDir, "cache", "webpack"),
    };

    // Adds `joy.config.js` as a buildDependency when custom webpack config is provided
    if (config.webpack && config.configFile) {
      cache.buildDependencies = {
        config: [config.configFile],
      };
    }

    webpackConfig.cache = cache;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TODO: remove ignore when webpack 5 is stable
    webpackConfig.optimization.realContentHash = false;
  }

  webpackConfig = await buildConfiguration(webpackConfig, {
    rootDirectory: dir,
    customAppFile,
    isDevelopment: dev,
    isServer,
    assetPrefix: config.assetPrefix || "",
    sassOptions: config.sassOptions,
    lessOptions: config.lessOptions,
    productionBrowserSourceMaps,
  });

  const originalDevtool = webpackConfig.devtool;
  if (typeof config.webpack === "function") {
    webpackConfig = config.webpack(webpackConfig, {
      dir,
      dev,
      isServer,
      buildId,
      config,
      defaultLoaders,
      totalPages,
      webpack,
    });

    if (dev && originalDevtool !== webpackConfig.devtool) {
      webpackConfig.devtool = originalDevtool;
      devtoolRevertWarning(originalDevtool);
    }

    if (typeof (webpackConfig as any).then === "function") {
      console.warn("> Promise returned in joy config.");
    }
  }

  // Backwards compat with webpack-dev-middleware options object
  if (typeof config.webpackDevMiddleware === "function") {
    const options = config.webpackDevMiddleware({
      watchOptions: webpackConfig.watchOptions,
    });
    if (options.watchOptions) {
      webpackConfig.watchOptions = options.watchOptions;
    }
  }

  function canMatchCss(rule: webpack.RuleSetCondition | undefined): boolean {
    if (!rule) {
      return false;
    }

    const fileNames = ["/tmp/test.css", "/tmp/test.scss", "/tmp/test.sass", "/tmp/test.less", "/tmp/test.styl"];

    if (rule instanceof RegExp && fileNames.some((input) => rule.test(input))) {
      return true;
    }

    if (typeof rule === "function") {
      if (
        fileNames.some((input) => {
          try {
            if (rule(input)) {
              return true;
            }
          } catch (_) {}
          return false;
        })
      ) {
        return true;
      }
    }

    if (Array.isArray(rule) && rule.some(canMatchCss)) {
      return true;
    }

    return false;
  }

  const hasUserCssConfig =
    (webpackConfig.module?.rules as RuleSetRule[]).some((rule) => canMatchCss(rule.test) || canMatchCss(rule.include)) ?? false;

  if (hasUserCssConfig) {
    // only show warning for one build
    if (isServer) {
      console.warn(
        chalk.yellow.bold("Warning: ") + chalk.bold("Built-in CSS support is being disabled due to custom CSS configuration being detected.")
      );
    }

    if ((webpackConfig.module?.rules as RuleSetRule[]).length) {
      // Remove default CSS Loader
      webpackConfig.module!.rules = (webpackConfig.module?.rules as RuleSetRule[]).filter(
        (r) => !(typeof r.oneOf?.[0]?.options === "object" && r.oneOf[0].options.__joy_css_remove === true)
      );
    }
    if (webpackConfig.plugins?.length) {
      // Disable CSS Extraction Plugin
      webpackConfig.plugins = webpackConfig.plugins.filter((p) => (p as any).__joy_css_remove !== true);
    }
    if (webpackConfig.optimization?.minimizer?.length) {
      // Disable CSS Minifier
      webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter((e) => (e as any).__joy_css_remove !== true);
    }
  } else {
    await __overrideCssConfiguration(dir, !dev, webpackConfig);
  }

  // Inject missing React Refresh loaders so that development mode is fast:
  if (hasReactRefresh) {
    // attachReactRefresh(webpackConfig, defaultLoaders.babel)
  }

  if (isServer && webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
    let foundTsRule = false;

    webpackConfig.module.rules = (webpackConfig.module?.rules as RuleSetRule[]).filter((rule): boolean => {
      if (!(rule.test instanceof RegExp)) return true;
      if ("noop.ts".match(rule.test) && !"noop.js".match(rule.test)) {
        foundTsRule = rule.use === defaultLoaders.babel;
        return !foundTsRule;
      }
      return true;
    });

    if (foundTsRule) {
      console.warn(
        "\n@zeit/joy-typescript is no longer needed since Joy.js has built-in support for TypeScript now. Please remove it from your joy.config.js and your .babelrc\n"
      );
    }
  }

  if (!dev) {
    // entry is always a function
    webpackConfig.entry = await (webpackConfig.entry as () => any)();
  }

  return webpackConfig;
}
