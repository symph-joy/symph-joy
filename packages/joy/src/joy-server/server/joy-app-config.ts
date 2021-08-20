import os from "os";
import chalk from "chalk";
import { execOnce } from "../lib/utils";
import * as Log from "../../build/output/log";
import { object } from "prop-types";
import findUp from "find-up";
import { CONFIG_FILE, OUT_DIRECTORY } from "../lib/constants";
import * as path from "path";
import { basename, extname, resolve } from "path";
import fs from "fs";
import { Configurable, ConfigValue } from "@symph/config";
import { Integer } from "@tsed/schema";

const targets = ["server", "serverless", "experimental-serverless-trace"];
const reactModes = ["legacy", "blocking", "concurrent"];

const experimentalWarning = execOnce(() => {
  Log.warn(chalk.bold(`You have enabled experimental feature(s).`), `Experimental features are not covered by semver, and may cause unexpected or broken application behavior. ` + `Use them at your own risk.`);
});

function isNil(v: any): v is undefined | null {
  return v === undefined || v === null;
}

export const existsSync = (f: string): boolean => {
  try {
    fs.accessSync(f, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
};

export interface IJoyConfig {
  dir: string; // = './'
  port?: number; // = 3000
  hostname?: string; // = 'localhost'
  dev: boolean; // = false
  quiet: boolean; // = false
  customServer: boolean; // = false

  env: string[]; //= []
  webpack: any; // = null
  webpackDevMiddleware: any; //= null
  distDir: string; // = '.joy'
  assetPrefix: string; // = ''
  configOrigin: string; // = 'default'
  useFileSystemPublicRoutes: boolean; // = true
  generateBuildId: () => null; // = () => null
  generateEtags: boolean; // = true
  pageExtensions: string[]; // = ['tsx', 'ts', 'jsx', 'js']
  target: string; // = 'server'
  poweredByHeader: boolean; // = true
  compress: boolean; // = true
  devIndicators: any;
  // = {
  //   buildActivity: true,
  //   autoPrerender: true,
  // }
  onDemandEntries: any;
  // = {
  // maxInactiveAge: 60 * 1000,
  // pagesBufferLength: 2,
  // }
  amp: any;
  // = {
  //   canonicalBase: '',
  // }
  basePath: string; // = ''
  sassOptions: any; // = {}
  trailingSlash: boolean; // = false
  experimental: any;
  //   = {
  //   cpus: Math.max(
  //     1,
  //     (Number(process.env.CIRCLE_NODE_TOTAL) ||
  //       (os.cpus() || {length: 1}).length) - 1
  //   )
  //   modern: false,
  //   plugins: false,
  //   profiling: false,
  //   sprFlushToDisk: true,
  //   reactMode: 'legacy',
  //   workerThreads: false,
  //   pageEnv: false,
  //   productionBrowserSourceMaps: false,
  //   optimizeFonts: false,
  //   optimizeImages: false,
  //   scrollRestoration: false,
  // }

  future: any;
  //   = {
  //   excludeDefaultMomentLocales: false,
  // }
  serverRuntimeConfig: Record<string, any>; // = {}
  publicRuntimeConfig: Record<string, any>; // = {}
  reactStrictMode: boolean; // = false;

  resolveAppDir(...pathSegments: string[]): string;
}

@Configurable()
// @Component()
export class JoyAppConfig implements IJoyConfig {
  // @Hook({
  //   id: "addJoyConfigSchema",
  //   type: HookType.Waterfall,
  //   parallel: false,
  //   async: true,
  // })
  // private addJoyConfigSchema: HookPipe;
  //
  // @Hook({
  //   id: "onJoyConfigChanged",
  //   type: HookType.Waterfall,
  //   parallel: false,
  //   async: true,
  // })
  // private onJoyConfigChanged: HookPipe;

  // @Tap()
  // injectorAfterPropertiesSet<T>(
  //   instance: T,
  //   args: { instanceWrapper: IInstanceWrapper }
  // ): T {
  //   const { instanceWrapper } = args;
  //   // const config = getConfigMetadata(instanceWrapper.type)
  //   // if(!config || !config.length) {
  //   //   return instance
  //   // }
  //
  //   const setConfigValue = (instance as any)[PROP_KEY_JOY_CONFIG_SET_VALUE];
  //   if (setConfigValue) {
  //     setConfigValue.call(instance, this);
  //   }
  //
  //   return instance;
  // }

  [configKey: string]: any;

  @ConfigValue()
  pagesDir?: string;

  @ConfigValue()
  dir: string;

  @ConfigValue({ default: 3000 })
  @Integer()
  port: number;

  @ConfigValue()
  hostname: string;

  @ConfigValue({ default: false })
  dev: boolean;

  @ConfigValue({ default: false })
  quiet: boolean;

  @ConfigValue({ default: false })
  customServer: boolean;

  env: string[] = [];
  webpack: any = null;
  webpackDevMiddleware = null;

  distDir = ".joy";
  autoGenOutputDir = "gen-files";

  assetPrefix = "";
  configOrigin = "default";
  useFileSystemPublicRoutes = true;
  generateBuildId = () => null;
  generateEtags = true;
  pageExtensions = ["tsx", "ts", "jsx", "js"];
  target = "server";
  poweredByHeader = true;
  compress = true;
  devIndicators = {
    buildActivity: true,
    autoPrerender: true,
  };
  onDemandEntries = {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  };
  amp = {
    canonicalBase: "",
  };
  basePath = "";
  sassOptions = {};
  trailingSlash = false;
  experimental = {
    cpus: Math.max(1, (Number(process.env.CIRCLE_NODE_TOTAL) || (os.cpus() || { length: 1 }).length) - 1),
    modern: false,
    plugins: false,
    profiling: false,
    sprFlushToDisk: true,
    reactMode: "legacy",
    workerThreads: false,
    pageEnv: false,
    productionBrowserSourceMaps: false,
    optimizeFonts: false,
    optimizeImages: false,
    scrollRestoration: false,
  };

  future = {
    excludeDefaultMomentLocales: false,
  };
  serverRuntimeConfig = {};
  publicRuntimeConfig = {};
  reactStrictMode = false;

  public getAppRelativeDir(absPath: string) {
    return path.relative(this.dir, absPath);
  }

  public resolveAppDir(...subPaths: string[]) {
    return resolve(this.dir, ...subPaths);
  }

  public resolvePagesDir(): string {
    const maybePaths = ["src/pages", "src/client/pages"];
    if (this.pagesDir === undefined) {
      for (let i = 0; i < maybePaths.length; i++) {
        const path = maybePaths[i];
        const absPath = this.resolveAppDir(path);
        if (existsSync(absPath)) {
          this.pagesDir = absPath;
          break;
        }
      }

      if (!this.pagesDir) {
        throw new Error("> No `pages` directory found. Did you mean to run `joy` in the parent ](`../`) directory?");
      }
    }

    return this.pagesDir;
  }

  public resolveAutoGenOutDir(...subPaths: string[]) {
    return this.resolveAppDir(this.distDir, this.autoGenOutputDir, ...subPaths);
  }

  public resolveBuildOutDir(...subPaths: string[]) {
    return this.resolveAppDir(this.distDir, OUT_DIRECTORY, ...subPaths);
  }

  public resolveSSGOutDir(...subPaths: string[]) {
    return this.resolveAppDir(this.distDir, OUT_DIRECTORY, "react/export", ...subPaths);
  }

  public mergeCustomConfig(customConfig: { [key in keyof Partial<this>]: any }): void {
    (Object.keys(customConfig) as (keyof this)[]).forEach((key) => {
      const value = customConfig[key];
      if (isNil(value)) {
        return;
      }
      if (typeof value === "object" && value.constructor !== Array) {
        if (isNil(this[key])) {
          this[key] = {} as any;
        }
        this.deepMergeObj(this[key], object);
      } else {
        this[key] = value;
      }
    });
    this.validateConfig();
  }

  private deepMergeObj(objA: any = {}, objB: any) {
    const result: any = {};
    Object.keys(objB).forEach((key) => {
      if (!objB.hasOwnProperty(key)) return;
      const bValue = objB[key];
      if (isNil(bValue)) {
        return;
      }
      if (typeof bValue === "object" && bValue.constructor !== Array) {
        if (isNil(bValue)) {
          objA[key] = {} as any;
        }
        this.deepMergeObj(objA[key], bValue);
      } else {
        // 如果不是，就直接赋值
        objA[key] = bValue;
      }
    });
    return objA;
  }

  private validateConfig(): boolean {
    if (!isNil(this.experimental)) {
      experimentalWarning();

      if (this.experimental?.reactMode && !reactModes.includes(this.experimental.reactMode)) {
        throw new Error(`Specified React Mode is invalid. Provided: ${this.experimental.reactMode} should be one of ${reactModes.join(", ")}`);
      }
    }

    if (!isNil(this.distDir)) {
      if (typeof this.distDir !== "string") {
        throw new Error(`Specified distDir is not a string, found type "${typeof this.distDir}"`);
      }

      const userDistDir = this.distDir.trim();

      // don't allow public as the outDir as this is a reserved folder for
      // public files
      if (userDistDir === "public") {
        throw new Error(`The 'public' directory is reserved in Joy.js and can not be set as the 'distDir'. #can-not-output-to-public`);
      }
      // make sure outDir isn't an empty string as it can result in the provided
      // directory being deleted in development mode
      if (userDistDir.length === 0) {
        throw new Error(`Invalid distDir provided, distDir can not be an empty string. Please remove this config or set it to undefined`);
      }
    }

    if (!isNil(this.pageExtensions)) {
      if (!Array.isArray(this.pageExtensions)) {
        throw new Error(`Specified pageExtensions is not an array of strings, found "${this.pageExtensions}". Please update this config or remove it.`);
      }

      if (!this.pageExtensions.length) {
        throw new Error(`Specified pageExtensions is an empty array. Please update it with the relevant extensions or remove it.`);
      }

      this.pageExtensions.forEach((ext) => {
        if (typeof ext !== "string") {
          throw new Error(`Specified pageExtensions is not an array of strings, found "${ext}" of type "${typeof ext}". Please update this config or remove it.`);
        }
      });
    }

    if (typeof this.assetPrefix !== "string") {
      throw new Error(`Specified assetPrefix is not a string, found type "${typeof this.assetPrefix}" #invalid-assetprefix`);
    }

    if (this.basePath !== "") {
      if (this.basePath === "/") {
        throw new Error(`Specified basePath /. basePath has to be either an empty string or a path prefix"`);
      }

      if (!this.basePath.startsWith("/")) {
        throw new Error(`Specified basePath has to start with a /, found "${this.basePath}"`);
      }

      if (this.basePath !== "/") {
        if (this.basePath.endsWith("/")) {
          throw new Error(`Specified basePath should not end with /, found "${this.basePath}"`);
        }

        if (this.assetPrefix === "") {
          this.assetPrefix = this.basePath;
        }

        if (this.amp.canonicalBase === "") {
          this.amp.canonicalBase = this.basePath;
        }
      }
    }

    if (this.target && !targets.includes(this.target)) {
      throw new Error(`Specified target is invalid. Provided: "${this.target}" should be one of ${targets.join(", ")}`);
    }

    return true;
  }

  private normalizeConfig(phase: string, config: any) {
    if (typeof config === "function") {
      config = config(phase, { defaultConfig: this });

      if (typeof config.then === "function") {
        throw new Error("> Promise returned in joy config. #promise-in-next-config");
      }
    }
    return config;
  }

  public loadConfig(phase: string, dir: string, customConfig?: Partial<this> | null | any) {
    if (customConfig) {
      return this.mergeCustomConfig({
        configOrigin: "server",
        ...customConfig,
      });
    }
    const path = findUp.sync(CONFIG_FILE, {
      cwd: dir,
    });

    // If config file was found
    if (path?.length) {
      const userConfigModule = require(path);
      const userConfig = this.normalizeConfig(phase, userConfigModule.default || userConfigModule);

      if (Object.keys(userConfig).length === 0) {
        Log.warn("Detected joy.config.js, no exported configuration found. #empty-configuration");
      }

      if (userConfig.amp?.canonicalBase) {
        const { canonicalBase } = userConfig.amp || ({} as any);
        userConfig.amp = userConfig.amp || {};
        userConfig.amp.canonicalBase = (canonicalBase.endsWith("/") ? canonicalBase.slice(0, -1) : canonicalBase) || "";
      }

      return this.mergeCustomConfig({
        configOrigin: CONFIG_FILE,
        configFile: path,
        ...userConfig,
      });
    } else {
      const configBaseName = basename(CONFIG_FILE, extname(CONFIG_FILE));
      const nonJsPath = findUp.sync([`${configBaseName}.jsx`, `${configBaseName}.ts`, `${configBaseName}.tsx`, `${configBaseName}.json`], { cwd: dir });
      if (nonJsPath?.length) {
        throw new Error(`Configuring Joy via '${basename(nonJsPath)}' is not supported. Please replace the file with 'joy.config.js'.`);
      }
    }

    return this;
  }

  public getConfigSchema() {
    return this.addJoyConfigSchema.call({});
  }
}
