import findUp from "find-up";
import { CONFIG_FILE } from "../lib/constants";
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";

export type JoyConfig = {
  main?: string;
  serverRender?: boolean;
  webpack?:
    | null
    | ((
        webpackConfig: webpack.Configuration,
        {
          dir,
          dev,
          isServer: boolean,
          buildId,
          config,
          defaultLoaders: {},
          totalPages,
        }: {
          dir: string;
          dev: boolean;
          isServer: boolean;
          buildId: string;
          config: JoyConfig;
          defaultLoaders: {};
          totalPages: number;
        }
      ) => webpack.Configuration);
  webpackDevMiddleware?: null | ((webpackDevMiddlewareConfig: any) => any);
  poweredByHeader?: boolean;
  distDir?: string;
  assetPrefix?: string;
  configOrigin?: string;
  useFileSystemPublicRoutes?: boolean;
  generateBuildId?: () => string;
  generateEtags?: boolean;
  pageExtensions?: Array<string>;
  exportPathMap?: () => any;
  plugins?: Array<any>;
};

const defaultConfig: JoyConfig = {
  main: "src/index.js",
  serverRender: true,
  webpack: null,
  webpackDevMiddleware: null,
  poweredByHeader: true,
  distDir: ".joy",
  assetPrefix: "",
  configOrigin: "default",
  useFileSystemPublicRoutes: true,
  generateBuildId: () => {
    // nanoid is a small url-safe uuid generator
    const nanoid = require("nanoid");
    return nanoid();
  },
  generateEtags: true,
  pageExtensions: ["jsx", "js", "ts", "tsx"],
  exportPathMap: async () => {
    return {
      "/": { page: "/" },
    };
  },
};

type PhaseFunction = (
  phase: string,
  options: { defaultConfig: JoyConfig }
) => JoyConfig;

export default function loadConfig(
  phase: string,
  dir: string,
  customConfig?: JoyConfig
): JoyConfig {
  if (customConfig) {
    customConfig.configOrigin = "server";
    return preparePlugins({ ...defaultConfig, ...customConfig });
  }
  const path = findUp.sync(CONFIG_FILE, {
    cwd: dir,
  });

  // If config file was found
  if (path && path.length) {
    // $FlowFixMe
    const userConfigModule = require(path);
    const userConfigInitial: JoyConfig | PhaseFunction =
      userConfigModule.default || userConfigModule;
    if (typeof userConfigInitial === "function") {
      return preparePlugins({
        ...defaultConfig,
        configOrigin: CONFIG_FILE,
        ...userConfigInitial(phase, { defaultConfig }),
      });
    }

    return preparePlugins({
      ...defaultConfig,
      configOrigin: CONFIG_FILE,
      ...userConfigInitial,
    });
  }

  return defaultConfig;
}

function preparePlugins(config: JoyConfig) {
  if (!config.plugins) {
    return config;
  }

  config = { ...config };
  if (!Array.isArray(config.plugins)) {
    throw new Error(
      `in ${CONFIG_FILE}, the plugins config value must is a Array, or empty`
    );
  }

  config.plugins.forEach((plugin) => {
    config = plugin(config);
  });
  return config;
}
