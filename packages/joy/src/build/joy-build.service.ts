import { isWriteable } from "./is-writeable";
import { loadEnvConfig } from "../lib/load-env-config";
import { BUILD_MANIFEST, CLIENT_STATIC_FILES_PATH, EXPORT_DETAIL, EXPORT_MARKER, OUT_DIRECTORY, PAGES_MANIFEST, PHASE_PRODUCTION_BUILD, PRERENDER_MANIFEST, ROUTES_MANIFEST, SERVER_DIRECTORY, SERVERLESS_DIRECTORY } from "../joy-server/lib/constants";
import path from "path";
import loadCustomRoutes, { getRedirectStatus, normalizeRouteRegex, Redirect, RouteType } from "../lib/load-custom-routes";
import { fileExists } from "../lib/file-exists";
import * as Log from "./output/log";
import createSpinner from "./spinner";
import { verifyTypeScriptSetup } from "../lib/verifyTypeScriptSetup";
import { hasCustomGetInitialProps, isPageStatic, PageInfo, printCustomRoutes, printTreeView } from "./utils";
import { __ApiPreviewProps } from "../joy-server/server/api-utils";
import crypto from "crypto";
import { createEntrypoints, createPagesMapping } from "./entries";
import { PUBLIC_DIR_MIDDLEWARE_CONFLICT } from "../lib/constants";
import { pathToRegexp } from "path-to-regexp";
import { getRouteRegex, getSortedRoutes, isDynamicRoute } from "../joy-server/lib/router/utils";
import { promises, writeFileSync } from "fs";
import getBaseWebpackConfig from "./webpack-config";
import { CompilerResult, runCompiler } from "./compiler";
import formatWebpackMessages from "../client/dev/error-overlay/format-webpack-messages";
import chalk from "chalk";
import { PagesManifest } from "./webpack/plugins/pages-manifest-plugin";
import { BuildManifest } from "../joy-server/server/get-page-files";
import { getPagePath } from "../joy-server/server/require";
import { normalizePagePath } from "../joy-server/server/normalize-page-path";
import escapeStringRegexp from "escape-string-regexp";
import { writeBuildId } from "./write-build-id";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { BuildConfig } from "./build-config";
import devalue from "devalue";
import { CoreContext, Component, AutowireHook, HookType, IHook } from "@symph/core";
import { getWebpackConfigForSrc } from "./webpack-config-for-src";
import { FileGenerator } from "../plugin/file-generator";
import { FileScanner } from "../joy-server/server/scanner/file-scanner";
import { Worker } from "jest-worker";
import { ReactRouter } from "@symph/react";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyExportAppService } from "../export/joy-export-app.service";
import { getWebpackConfigForJoy } from "./webpack-config-for-joy";

export type SsgRoute = {
  initialRevalidateSeconds: number | false;
  srcRoute: string | null;
  dataRoute: string;
};

export type DynamicSsgRoute = {
  routeRegex: string;
  fallback: string | null | false;
  dataRoute: string;
  dataRouteRegex: string;
};

export type ClientSsgManifest = Set<string>;

export type PrerenderManifest = {
  version: 2;
  routes: { [route: string]: SsgRoute };
  dynamicRoutes: { [route: string]: DynamicSsgRoute };
  preview?: __ApiPreviewProps; // todo remove
};

@Component()
export class JoyBuildService {
  @AutowireHook({ type: HookType.Traverse, async: true })
  private onWillJoyBuild: IHook<{ dev: boolean }, void>;

  private dir: string;
  private distDir: string;
  private outDir: string;
  // const isLikeServerless = isTargetLikeServerless(target);
  private isLikeServerless = false; // todo remove
  private buildManifestPath: string;

  constructor(
    private readonly coreContext: CoreContext,
    private joyConfig: JoyAppConfig,
    private buildConfig: BuildConfig,
    private fileGenerator: FileGenerator,
    private fileScanner: FileScanner,
    private joyReactRoute: ReactRouter,
    private prerenderService: JoyPrerenderService,
    public joyExportAppService: JoyExportAppService
  ) {
    this.dir = joyConfig.resolveAppDir();
    this.distDir = joyConfig.resolveAppDir(joyConfig.distDir);
    this.outDir = joyConfig.resolveAppDir(joyConfig.distDir, OUT_DIRECTORY, "react");
    this.buildManifestPath = path.join(this.outDir, BUILD_MANIFEST);
  }

  public async buildSrcAndScan() {
    const buildId = await this.buildConfig.getBuildId();
    const target = this.joyConfig.target;
    const pagesDir = this.joyConfig.resolvePagesDir();
    const serverWebpackConfig = await getBaseWebpackConfig(this.dir, {
      // tracer,
      buildId,
      // reactProductionProfiling,
      isServer: true,
      config: this.joyConfig,
      target,
      pagesDir,
      entrypoints: {},
      rewrites: [],
    });

    const distPagesDir = this.joyConfig.resolveAppDir(this.joyConfig.distDir, "dist/src");

    const srcWebpackConfig = await getWebpackConfigForSrc(serverWebpackConfig, this.joyConfig);
    const srcResult = await runCompiler(srcWebpackConfig);
    if (!srcResult.errors) {
      return srcResult;
    }

    await this.fileScanner.scan(distPagesDir);
    await this.fileGenerator.generate(false);

    return srcResult;
  }

  public async analysisBuild(): Promise<Map<string, PageInfo>> {
    const reactRoutes = this.joyReactRoute.getRoutes();
    const staticCheckWorker = require.resolve("./utils");
    const staticCheckWorkers = new Worker(staticCheckWorker, {
      numWorkers: 2,
      // enableWorkerThreads: config.experimental.workerThreads,
    }) as Worker & { isPageStatic: typeof isPageStatic };

    staticCheckWorkers.getStdout().pipe(process.stdout);
    staticCheckWorkers.getStderr().pipe(process.stderr);

    // const staticCheckWorkers = require("./utils");

    const analysisBegin = process.hrtime();
    const pageInfos = new Map<string, PageInfo>();

    // const reactRoutes = this.joyReactRoute.getRoutes()

    const manifestPath = path.join(this.outDir, this.isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY, PAGES_MANIFEST);

    const pagesManifest = JSON.parse(await promises.readFile(manifestPath, "utf8")) as PagesManifest;
    const buildManifest = JSON.parse(await promises.readFile(this.buildManifestPath, "utf8")) as BuildManifest;

    await Promise.all(
      reactRoutes.map(async (reactRoute) => {
        const { path: _pathname, providerName: providerName, hasState, hasStaticState } = reactRoute;
        const path: string = _pathname as string;
        if (!providerName) {
          throw new Error(`The route${path} is not a provider.`);
        }

        let isSsg = false;
        let isStatic = false;
        let isHybridAmp = false;
        let ssgPageRoutes: string[] | null = null;
        let ssgFallback = false;

        // todo 计算路由首次加的大小
        // const actualPage = normalizePagePath(page);
        // const [selfSize, allSize] = await getJsPageSizeInKb(
        //   srcPath,
        //   this.outDir,
        //   buildManifest,
        //   config.experimental.modern
        // );

        // const routeModule = this.coreContext.getProviderDefinition<
        //   ClassProvider
        // >(providerId);
        // const routeClass = (routeModule?.useClass as any) as typeof ReactBaseController;
        const pathIsDynamic = isDynamicRoute(path);
        const parentRoutes = this.joyReactRoute.getParentRoutes(reactRoute.path);

        // const hasStaticModelState = !!routeClass.prototype.initialModelStaticState;
        const hasStaticModelState = !!hasStaticState;
        // const hasModelState = !!routeClass.prototype.initialModelState;
        const hasModelState = hasState;
        isSsg = hasStaticModelState;
        isStatic = !hasStaticModelState && !hasModelState;

        // if (hasStaticModelState && !pathIsDynamic) {
        //   throw new Error(
        //     `getStaticPaths can only be used with dynamic pages, not '${page}'.`
        //   )
        // }

        // try {
        //   const workerResult = await staticCheckWorkers.isPageStatic(
        //     page,
        //     serverBundle,
        //     runtimeEnvConfig
        //   );
        //
        //   if (workerResult.isHybridAmp) {
        //     isHybridAmp = true;
        //     hybridAmpPages.add(page);
        //   }
        //
        //   if (workerResult.hasStaticProps) {
        //     ssgPages.add(page);
        //     isSsg = true;
        //
        //     if (workerResult.prerenderRoutes) {
        //       additionalSsgPaths.set(page, workerResult.prerenderRoutes);
        //       ssgPageRoutes = workerResult.prerenderRoutes;
        //     }
        //
        //     if (workerResult.prerenderFallback === "unstable_blocking") {
        //       ssgBlockingFallbackPages.add(page);
        //     } else if (workerResult.prerenderFallback === true) {
        //       ssgStaticFallbackPages.add(page);
        //     }
        //   } else if (workerResult.hasServerProps) {
        //     serverPropsPages.add(page);
        //   } else if (
        //     workerResult.isStatic &&
        //     customAppGetInitialProps === false
        //   ) {
        //     staticPages.add(page);
        //     isStatic = true;
        //   }
        //
        //   if (hasPages404 && page === "/404") {
        //     if (!workerResult.isStatic && !workerResult.hasStaticProps) {
        //       throw new Error(PAGES_404_GET_INITIAL_PROPS_ERROR);
        //     }
        //     // we need to ensure the 404 lambda is present since we use
        //     // it when _app has getInitialProps
        //     if (customAppGetInitialProps && !workerResult.hasStaticProps) {
        //       staticPages.delete(page);
        //     }
        //   }
        // } catch (err) {
        //   if (err.message !== "INVALID_DEFAULT_EXPORT") throw err;
        //   invalidPages.add(page);
        // }
        pageInfos.set(path, {
          size: -1,
          totalSize: -1,
          static: isStatic,
          isSsg,
          isHybridAmp,
          ssgPageRoutes,
          ssgFallback,
          initialRevalidateSeconds: false as const,
        } as PageInfo);
      })
    );

    return pageInfos;
  }

  // public async getPrerenderPath(reactRoute: IJoyReactRouteBuild): Promise<string[]>{
  //   const {s} = reactRoute
  //   const routeModule = this.coreContext.getProviderDefinition<ClassProvider>()
  //   return []
  // }

  public async prerenderRoutes(pageInfos: Map<string, PageInfo>): Promise<PrerenderManifest> {
    const distDir = this.distDir;
    const outDir = this.outDir;
    const dir = this.dir;
    const buildId = await this.buildConfig.getBuildId();

    const prerenderInfos = await this.prerenderService.getPrerenderList();

    // const combinedPages = [...staticPages, ...ssgPages];
    const combinedPages = prerenderInfos.reduce<string[]>((value, info, infoIndex) => {
      value.push(...info.paths);
      return value;
    }, []);
    // const {exportApp} = require("../export");

    const exportConfig: any = {
      // ...config,
      initialPageRevalidationMap: {},

      exportPathMap: (defaultMap: any) => {
        prerenderInfos.forEach((prerenderInfo) => {
          const { route, paths, isFallback } = prerenderInfo;
          for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            if (defaultMap[path]) {
              console.warn(`multi define prerender url path: ${path}`);
            }
            defaultMap[path] = { page: path, query: {} };
          }
          if (isDynamicRoute(prerenderInfo.route) && isFallback) {
            defaultMap[route] = { page: path, query: { __joyFallback: true } };
          }
        });

        return defaultMap;
      },
      trailingSlash: false,
    };

    const exportOptions = {
      silent: false,
      buildExport: true,
      threads: this.joyConfig.experimental.cpus,
      pages: combinedPages,
      outdir: path.join(outDir, "prerender"),
      statusMessage: "Generating static pages",
      ...exportConfig,
    };

    // tood 导出需要的joyAppConfig 独立出来
    // await exportApp(dir, exportOptions, exportConfig);
    await this.joyExportAppService.exportApp(dir, exportOptions);

    const postBuildSpinner = createSpinner({
      prefixText: `${Log.prefixes.info} Finalizing page optimization`,
    });

    const finalPrerenderRoutes: { [route: string]: SsgRoute } = {};
    const finalDynamicRoutes: PrerenderManifest["dynamicRoutes"] = {};
    prerenderInfos.forEach((prerenderInfo) => {
      const { route, paths, isFallback } = prerenderInfo;
      const isDynamic = isDynamicRoute(route);
      for (let i = 0; i < paths.length; i++) {
        const pathname = paths[i];
        const file = normalizePagePath(pathname);
        finalPrerenderRoutes[pathname] = {
          initialRevalidateSeconds: exportConfig.initialPageRevalidationMap[pathname],
          srcRoute: isDynamic ? route : null,
          dataRoute: path.posix.join("/_joy/data", buildId, `${file}.json`),
        };
      }

      if (isDynamic) {
        const normalizedRoute = normalizePagePath(route);
        const dataRoute = path.posix.join("/_joy/data", buildId, `${normalizedRoute}.json`);
        finalDynamicRoutes[route] = {
          routeRegex: normalizeRouteRegex(getRouteRegex(route).re.source),
          dataRoute,
          fallback: isFallback ? `${normalizedRoute}.html` : false,
          dataRouteRegex: normalizeRouteRegex(getRouteRegex(dataRoute.replace(/\.json$/, "")).re.source.replace(/\(\?:\\\/\)\?\$$/, "\\.json$")),
        };
      }
    });

    const prerenderManifest: PrerenderManifest = {
      version: 2,
      routes: finalPrerenderRoutes,
      dynamicRoutes: finalDynamicRoutes,
    };

    await promises.writeFile(path.join(outDir, PRERENDER_MANIFEST), JSON.stringify(prerenderManifest), "utf8");
    await this.generateClientSsgManifest(prerenderManifest, {
      outDir,
      buildId,
      isModern: this.joyConfig.experimental.modern,
    });

    if (postBuildSpinner) postBuildSpinner.stopAndPersist();
    console.log();
    return prerenderManifest;
  }

  public async triggerOnWillJoyBuild(): Promise<void> {
    await this.onWillJoyBuild.call({ dev: this.joyConfig.dev });
  }

  public async build(reactProductionProfiling = false, debugOutput = false): Promise<void> {
    // await this.onWillJoyBuild.call({dev: false})
    await this.triggerOnWillJoyBuild();
    const config = this.joyConfig;
    const dir = this.dir;
    if (!(await isWriteable(dir))) {
      throw new Error("> Build directory is not writeable.");
    }

    // attempt to load global env values so they are available in joy.config.js
    const { loadedEnvFiles } = loadEnvConfig(dir);

    // const config = loadConfig(PHASE_PRODUCTION_BUILD, dir, conf);
    const { target } = config;
    // const buildId = await generateBuildId(config.generateBuildId, nanoid);
    const buildId = await this.buildConfig.getBuildId();
    // const outDir = path.join(dir, config.outDir);
    const distDir = config.resolveAppDir(config.distDir);
    const outDir = config.resolveAppDir(config.distDir, OUT_DIRECTORY, "react");

    await promises.mkdir(outDir, { recursive: true });

    const { headers, rewrites, redirects } = await loadCustomRoutes(config);

    // if (ciEnvironment.isCI && !ciEnvironment.hasJoySupport) {
    const cacheDir = path.join(distDir, "cache");
    const hasCache = await fileExists(cacheDir);
    if (!hasCache) {
      // Intentionally not piping to stderr in case people fail in CI when
      // stderr is detected.
      console.log(`${Log.prefixes.warn} No build cache found. Please configure build caching for faster rebuilds.`);
    }
    // }
    const buildSpinner = createSpinner({
      prefixText: `${Log.prefixes.info} Creating an optimized production build`,
    });

    const publicDir = config.resolveAppDir("public");
    const pagesDir = this.joyConfig.resolvePagesDir();
    const hasPublicDir = await fileExists(publicDir);

    // const ignoreTypeScriptErrors = Boolean(config.typescript?.ignoreBuildErrors);
    const ignoreTypeScriptErrors = Boolean(true); // todo 从配置中读取值
    await verifyTypeScriptSetup(dir, pagesDir, !ignoreTypeScriptErrors);

    let tracer: any = null;
    if (config.experimental.profiling) {
      const { createTrace } = require("./profiler/profiler.js");
      tracer = createTrace(path.join(outDir, `profile-events.json`));
      tracer.profiler.startProfiling();
    }

    // const isLikeServerless = isTargetLikeServerless(target);
    const isLikeServerless = false; // todo remove

    // const pagePaths: string[] = await collectPages(
    //   pagesDir,
    //   config.pageExtensions
    // );
    const pagePaths: string[] = [];

    // needed for static exporting since we want to replace with HTML
    // files
    const allStaticPages = new Set<string>();
    const allPageInfos = new Map<string, PageInfo>();

    const previewProps: __ApiPreviewProps = {
      previewModeId: crypto.randomBytes(16).toString("hex"),
      previewModeSigningKey: crypto.randomBytes(32).toString("hex"),
      previewModeEncryptionKey: crypto.randomBytes(32).toString("hex"),
    };

    // const mappedPages = createPagesMapping(pagePaths, config.pageExtensions);
    const mappedPages = createPagesMapping(pagePaths, config.pageExtensions);
    const entrypoints = createEntrypoints(mappedPages, target as any, buildId, previewProps, config, loadedEnvFiles);
    const pageKeys = Object.keys(mappedPages);
    const conflictingPublicFiles: string[] = [];
    const hasCustomErrorPage = mappedPages["/_error"].startsWith("private-joy-pages");
    const hasPages404 = Boolean(mappedPages["/404"] && mappedPages["/404"].startsWith("private-joy-pages"));
    let hasNonStaticErrorPage: boolean;

    if (hasPublicDir) {
      const hasPublicUnderScoreJoyDir = await fileExists(path.join(publicDir, "_joy"));
      if (hasPublicUnderScoreJoyDir) {
        throw new Error(PUBLIC_DIR_MIDDLEWARE_CONFLICT);
      }
    }

    // Check if pages conflict with files in `public`
    // Only a page of public file can be served, not both.
    for (const page in mappedPages) {
      const hasPublicPageFile = await fileExists(path.join(publicDir, page === "/" ? "/index" : page), "file");
      if (hasPublicPageFile) {
        conflictingPublicFiles.push(page);
      }
    }

    const numConflicting = conflictingPublicFiles.length;

    if (numConflicting) {
      throw new Error(`Conflicting public and page file${numConflicting === 1 ? " was" : "s were"} found. ${conflictingPublicFiles.join("\n")}`);
    }

    const nestedReservedPages = pageKeys.filter((page) => {
      return page.match(/\/(_app|_document|_error)$/) && path.dirname(page) !== "/";
    });

    if (nestedReservedPages.length) {
      Log.warn(`The following reserved Joy.js pages were detected not directly under the pages directory:\n` + nestedReservedPages.join("\n"));
    }

    const buildCustomRoute = (
      r: {
        source: string;
        basePath?: false;
        statusCode?: number;
        destination?: string;
      },
      type: RouteType
    ) => {
      const keys: any[] = [];

      if (r.basePath !== false) {
        r.source = `${config.basePath}${r.source}`;

        if (r.destination && r.destination.startsWith("/")) {
          r.destination = `${config.basePath}${r.destination}`;
        }
      }

      const routeRegex = pathToRegexp(r.source, keys, {
        strict: true,
        sensitive: false,
        delimiter: "/", // default is `/#?`, but Joy does not pass query info
      });

      return {
        ...r,
        ...(type === "redirect"
          ? {
              statusCode: getRedirectStatus(r as Redirect),
              permanent: undefined,
            }
          : {}),
        regex: normalizeRouteRegex(routeRegex.source),
      };
    };

    const routesManifestPath = path.join(outDir, ROUTES_MANIFEST);
    const routesManifest: {
      version: number;
      pages404: boolean;
      basePath: string;
      redirects: Array<ReturnType<typeof buildCustomRoute>>;
      rewrites: Array<ReturnType<typeof buildCustomRoute>>;
      headers: Array<ReturnType<typeof buildCustomRoute>>;
      dynamicRoutes: Array<{
        page: string;
        regex: string;
        namedRegex?: string;
        routeKeys?: { [key: string]: string };
      }>;
      dataRoutes: Array<{
        page: string;
        routeKeys?: { [key: string]: string };
        dataRouteRegex: string;
        namedDataRouteRegex?: string;
      }>;
    } = {
      version: 3,
      pages404: true,
      basePath: config.basePath,
      redirects: redirects.map((r) => buildCustomRoute(r, "redirect")),
      rewrites: rewrites.map((r) => buildCustomRoute(r, "rewrite")),
      headers: headers.map((r) => buildCustomRoute(r, "header")),
      dynamicRoutes: getSortedRoutes(pageKeys)
        .filter(isDynamicRoute)
        .map((page) => {
          const routeRegex = getRouteRegex(page);
          return {
            page,
            regex: normalizeRouteRegex(routeRegex.re.source),
            routeKeys: routeRegex.routeKeys,
            namedRegex: routeRegex.namedRegex,
          };
        }),
      dataRoutes: [],
    };

    // await promises.mkdir(outDir, { recursive: true });
    // // We need to write the manifest with rewrites before build
    // // so serverless can import the manifest
    // await promises.writeFile(
    //   routesManifestPath,
    //   JSON.stringify(routesManifest),
    //   "utf8"
    // );

    const srcResult = await this.buildSrcAndScan();

    const configs = await Promise.all([
      getBaseWebpackConfig(dir, {
        tracer,
        buildId,
        reactProductionProfiling,
        isServer: false,
        config,
        target,
        pagesDir,
        entrypoints: entrypoints.client,
        rewrites,
        routes: this.joyReactRoute.getRoutes(),
      }),
      getBaseWebpackConfig(dir, {
        tracer,
        buildId,
        reactProductionProfiling,
        isServer: true,
        config,
        target,
        pagesDir,
        entrypoints: entrypoints.server,
        rewrites,
        routes: this.joyReactRoute.getRoutes(),
      }),
    ]);

    const [clientConfig, serverConfig] = configs;

    const joyWebpackConfig = await getWebpackConfigForJoy(serverConfig, this.joyConfig);

    if (clientConfig.optimization && (clientConfig.optimization.minimize !== true || (clientConfig.optimization.minimizer && clientConfig.optimization.minimizer.length === 0))) {
      Log.warn(`Production code optimization has been disabled in your project.`);
    }

    const webpackBuildStart = process.hrtime();

    let result: CompilerResult = { warnings: [], errors: [] };
    result = await runCompiler([clientConfig, serverConfig, joyWebpackConfig]);
    result = {
      warnings: [...srcResult.warnings, ...result.warnings],
      errors: [...srcResult.errors, ...result.errors],
    };

    const webpackBuildEnd = process.hrtime(webpackBuildStart);
    if (buildSpinner) {
      buildSpinner.stopAndPersist();
    }
    result = formatWebpackMessages(result);

    if (result.errors.length > 0) {
      // Only keep the first error. Others are often indicative
      // of the same problem, but confuse the reader with noise.
      if (result.errors.length > 1) {
        result.errors.length = 1;
      }
      const error = result.errors.join("\n\n");

      console.error(chalk.red("Failed to compile.\n"));

      if (error.indexOf("private-joy-pages") > -1 && error.indexOf("does not contain a default export") > -1) {
        const page_name_regex = /'private-joy-pages\/(?<page_name>[^']*)'/;
        const parsed = page_name_regex.exec(error);
        const page_name = parsed && parsed.groups && parsed.groups.page_name;
        throw new Error(`webpack build failed: found page without a React Component as default export in pages/${page_name}\n`);
      }

      console.error(error);
      console.error();

      if (error.indexOf("private-joy-pages") > -1 || error.indexOf("__joy_polyfill__") > -1) {
        throw new Error("> webpack config.resolve.alias was incorrectly overridden.");
      }
      throw new Error("> Build failed because of webpack errors");
    } else {
      if (result.warnings.length > 0) {
        Log.warn("Compiled with warnings\n");
        console.warn(result.warnings.join("\n\n"));
        console.warn();
      } else {
        Log.info("Compiled successfully");
      }
    }

    const postCompileSpinner = createSpinner({
      prefixText: `${Log.prefixes.info} Collecting page data`,
    });

    const manifestPath = path.join(outDir, isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY, PAGES_MANIFEST);
    const buildManifestPath = path.join(outDir, BUILD_MANIFEST);

    const ssgPages = new Set<string>();
    const staticPages = new Set<string>();
    const buildManifest = JSON.parse(await promises.readFile(buildManifestPath, "utf8")) as BuildManifest;

    let customAppGetInitialProps: boolean | undefined;

    process.env.JOY_PHASE = PHASE_PRODUCTION_BUILD;

    // // const staticCheckWorkers = new Worker(staticCheckWorker, {
    // //   numWorkers: config.experimental.cpus,
    // //   enableWorkerThreads: config.experimental.workerThreads,
    // // }) as Worker & { isPageStatic: typeof isPageStatic }
    // //
    // // staticCheckWorkers.getStdout().pipe(process.stdout)
    // // staticCheckWorkers.getStderr().pipe(process.stderr)
    //
    // const staticCheckWorkers = require("./utils");

    const runtimeEnvConfig = {
      publicRuntimeConfig: config.publicRuntimeConfig,
      serverRuntimeConfig: config.serverRuntimeConfig,
    };

    hasNonStaticErrorPage = hasCustomErrorPage && (await hasCustomGetInitialProps(getPagePath("/_error", outDir), runtimeEnvConfig, false));

    const analysisBegin = process.hrtime();

    const reactRoutes = this.joyReactRoute.getRoutes();
    const pageInfos: Map<string, PageInfo> = await this.analysisBuild();
    pageInfos.forEach((pageInfo, route) => {
      if (pageInfo.isSsg) {
        ssgPages.add(route);
      }
      if (pageInfo.static) {
        staticPages.add(route);
      }
    });

    await writeBuildId(outDir, buildId);

    await this.prerenderRoutes(pageInfos);

    // if (ssgPages.size > 0) {
    // We update the routes manifest after the build with the
    // data routes since we can't determine these until after build
    routesManifest.dataRoutes = getSortedRoutes([
      // ...serverPropsPages,
      ...ssgPages,
    ]).map((page) => {
      // todo change name to  routePath
      // const pagePath = normalizePagePath(page);
      const pagePath = page;
      const dataRoute = path.posix.join("/_joy/data", buildId, `${pagePath}.json`);

      let dataRouteRegex: string;
      let namedDataRouteRegex: string | undefined;
      let routeKeys: { [named: string]: string } | undefined;

      if (isDynamicRoute(page)) {
        const routeRegex = getRouteRegex(dataRoute.replace(/\.json$/, ""));

        dataRouteRegex = normalizeRouteRegex(routeRegex.re.source.replace(/\(\?:\\\/\)\?\$$/, "\\.json$"));
        namedDataRouteRegex = routeRegex.namedRegex!.replace(/\(\?:\/\)\?\$$/, "\\.json$");
        routeKeys = routeRegex.routeKeys;
      } else {
        dataRouteRegex = normalizeRouteRegex(new RegExp(`^${path.posix.join("/_joy/data", escapeStringRegexp(buildId), `${pagePath}.json`)}$`).source);
      }

      return {
        page,
        routeKeys,
        dataRouteRegex,
        namedDataRouteRegex,
      };
    });

    // @ts-ignore
    routesManifest.reactRoutes = reactRoutes;

    await promises.writeFile(routesManifestPath, JSON.stringify(routesManifest), "utf8");
    // }

    // Since custom _app.js can wrap the 404 page we have to opt-out of static optimization if it has getInitialProps
    // Only export the static 404 when there is no /_error present
    const useStatic404 = !customAppGetInitialProps && (!hasNonStaticErrorPage || hasPages404);

    if (postCompileSpinner) postCompileSpinner.stopAndPersist();

    await promises.writeFile(
      path.join(outDir, EXPORT_MARKER),
      JSON.stringify({
        version: 1,
        hasExportPathMap: typeof config.exportPathMap === "function",
        exportTrailingSlash: config.trailingSlash === true,
      }),
      "utf8"
    );
    await promises.unlink(path.join(outDir, EXPORT_DETAIL)).catch((err) => {
      if (err.code === "ENOENT") {
        return Promise.resolve();
      }
      return Promise.reject(err);
    });

    staticPages.forEach((pg) => allStaticPages.add(pg));
    pageInfos.forEach((info: PageInfo, key: string) => {
      allPageInfos.set(key, info);
    });

    await printTreeView(Object.keys(mappedPages), allPageInfos, isLikeServerless, {
      distPath: outDir,
      buildId: buildId,
      pagesDir,
      useStatic404,
      pageExtensions: config.pageExtensions,
      buildManifest,
      isModern: config.experimental.modern,
    });

    if (debugOutput) {
      printCustomRoutes({ redirects, rewrites, headers });
    }
  }

  private generateClientSsgManifest(prerenderManifest: PrerenderManifest, { buildId, outDir, isModern }: { buildId: string; outDir: string; isModern: boolean }) {
    const ssgPages: ClientSsgManifest = new Set<string>([
      ...Object.entries(prerenderManifest.routes)
        // Filter out dynamic routes
        .filter(([, { srcRoute }]) => srcRoute == null)
        .map(([route]) => route),
      ...Object.keys(prerenderManifest.dynamicRoutes),
    ]);

    const clientSsgManifestPaths = ["_ssgManifest.js", isModern && "_ssgManifest.module.js"].filter(Boolean).map((f) => path.join(`${CLIENT_STATIC_FILES_PATH}/${buildId}`, f as string));
    const clientSsgManifestContent = `self.__SSG_MANIFEST=${devalue(ssgPages)};self.__SSG_MANIFEST_CB&&self.__SSG_MANIFEST_CB()`;
    clientSsgManifestPaths.forEach((clientSsgManifestPath) => writeFileSync(path.join(outDir, clientSsgManifestPath), clientSsgManifestContent));
  }
}
