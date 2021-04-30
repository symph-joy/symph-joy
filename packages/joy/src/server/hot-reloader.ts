import { getOverlayMiddleware } from "@next/react-dev-overlay/lib/middleware";
import { NextHandleFunction } from "connect";
import { IncomingMessage, ServerResponse } from "http";
import { WebpackHotMiddleware } from "./hot-middleware";
import { join, relative as relativePath } from "path";
import { UrlObject } from "url";
import webpack, { Compilation, MultiCompiler } from "webpack";
import { createEntrypoints, createPagesMapping } from "../build/entries";
import { watchCompilers } from "../build/output";
import getBaseWebpackConfig from "../build/webpack-config";
import { API_ROUTE, NEXT_PROJECT_ROOT_DIST_CLIENT } from "../lib/constants";
import { recursiveDelete } from "../lib/recursive-delete";
import {
  BLOCKED_PAGES,
  CLIENT_STATIC_FILES_RUNTIME_AMP,
  CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH,
} from "../next-server/lib/constants";
import { __ApiPreviewProps } from "../next-server/server/api-utils";
import { route } from "../next-server/server/router";
import { findPageFile } from "./lib/find-page-file";
import { BUILDING, entries } from "./on-demand-entry-handler";
import { normalizePathSep } from "../next-server/server/normalize-page-path";
import getRouteFromEntrypoint from "../next-server/server/get-route-from-entrypoint";
import { isWriteable } from "../build/is-writeable";
import { ClientPagesLoaderOptions } from "../build/webpack/loaders/next-client-pages-loader";
import { stringify } from "querystring";
import loadCustomRoutes, { Rewrite } from "../lib/load-custom-routes";
import { FileScanner } from "../next-server/server/scanner/file-scanner";
import { JoyAppConfig } from "../next-server/server/joy-config/joy-app-config";
import { FileGenerator } from "../plugin/file-generator";
import { EventEmitter } from "events";
import OnDemandModuleHandler from "./on-demand-module-handler";
import { getWebpackConfigForSrc } from "../build/webpack-config-for-src";
import { Injectable } from "@symph/core";
import { BuildDevConfig } from "./build-dev-config";
import crypto from "crypto";
import { JoyReactRouterPluginDev } from "../router/joy-react-router-plugin-dev";

export async function renderScriptError(
  res: ServerResponse,
  error: Error,
  { verbose = true } = {}
) {
  // Asks CDNs and others to not to cache the errored page
  res.setHeader(
    "Cache-Control",
    "no-cache, no-store, max-age=0, must-revalidate"
  );

  if (
    (error as any).code === "ENOENT" ||
    error.message === "INVALID_BUILD_ID"
  ) {
    res.statusCode = 404;
    res.end("404 - Not Found");
    return;
  }

  if (verbose) {
    console.error(error.stack);
  }
  res.statusCode = 500;
  res.end("500 - Internal Error");
}

function addCorsSupport(req: IncomingMessage, res: ServerResponse) {
  const isApiRoute = req.url!.match(API_ROUTE);
  // API routes handle their own CORS headers
  if (isApiRoute) {
    return { preflight: false };
  }

  if (!req.headers.origin) {
    return { preflight: false };
  }

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  // Based on https://github.com/primus/access-control/blob/4cf1bc0e54b086c91e6aa44fb14966fa5ef7549c/index.js#L158
  if (req.headers["access-control-request-headers"]) {
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] as string
    );
  }

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return { preflight: true };
  }

  return { preflight: false };
}

const matchNextPageBundleRequest = route(
  "/_next/static/chunks/pages/:path*.js(\\.map|)"
);

// Recursively look up the issuer till it ends up at the root
function findEntryModule(issuer: any): any {
  if (issuer.issuer) {
    return findEntryModule(issuer.issuer);
  }

  return issuer;
}

function erroredPages(compilation: Compilation) {
  const failedPages: { [page: string]: any[] } = {};
  for (const error of compilation.errors) {
    // webpack5 升级后更改，error.origin -> error.module
    if (!error.module) {
      continue;
    }

    const entryModule = findEntryModule(error.module);
    const { name } = entryModule;
    if (!name) {
      continue;
    }

    // Only pages have to be reloaded
    if (!getRouteFromEntrypoint(name)) {
      continue;
    }

    const enhancedName = getRouteFromEntrypoint(name);

    if (!enhancedName) {
      continue;
    }

    if (!failedPages[enhancedName]) {
      failedPages[enhancedName] = [];
    }

    failedPages[enhancedName].push(error);
  }

  return failedPages;
}

@Injectable()
export default class HotReloader {
  private dir: string;
  private middlewares: any[];
  private pagesDir: string;
  private webpackHotMiddleware: (NextHandleFunction & any) | null;
  private stats: webpack.Stats | null;
  private serverStats: webpack.Stats | null;
  private clientError: Error | null = null;
  private serverError: Error | null = null;
  private serverPrevDocumentHash: string | undefined;
  private prevChunkNames?: Set<any>;
  private onDemandEntries: any;
  private onDemandModules: OnDemandModuleHandler;
  private watcher: ReturnType<MultiCompiler["watch"]>;

  private isBuildForDist: boolean;
  // private fileScanner: FileScanner;
  // private fileGenerator: FileGenerator;
  private doneCallbacks: EventEmitter = new EventEmitter();

  constructor(
    private joyAppConfig: JoyAppConfig,
    private fileGenerator: FileGenerator,
    private fileScanner: FileScanner,
    protected buildConfig: BuildDevConfig,
    private joyReactRouter: JoyReactRouterPluginDev
  ) {
    this.dir = this.joyAppConfig.resolveAppDir();
    this.middlewares = [];
    this.pagesDir = this.joyAppConfig.resolvePagesDir();
    this.webpackHotMiddleware = null;
    this.stats = null;
    this.serverStats = null;
    this.serverPrevDocumentHash = undefined;
  }

  private _devCachedPreviewProps: __ApiPreviewProps | undefined;

  protected getPreviewProps() {
    if (this._devCachedPreviewProps) {
      return this._devCachedPreviewProps;
    }
    return (this._devCachedPreviewProps = {
      previewModeId: crypto.randomBytes(16).toString("hex"),
      previewModeSigningKey: crypto.randomBytes(32).toString("hex"),
      previewModeEncryptionKey: crypto.randomBytes(32).toString("hex"),
    });
  }

  public async run(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: UrlObject
  ): Promise<{ finished?: true }> {
    // Usually CORS support is not needed for the hot-reloader (this is dev only feature)
    // With when the app runs for multi-zones support behind a proxy,
    // the current page is trying to access this URL via assetPrefix.
    // That's when the CORS support is needed.
    const { preflight } = addCorsSupport(req, res);
    if (preflight) {
      return {};
    }

    // // When a request comes in that is a page bundle, e.g. /_next/static/<buildid>/pages/index.js
    // // we have to compile the page using on-demand-entries, this middleware will handle doing that
    // // by adding the page to on-demand-entries, waiting till it's done
    // // and then the bundle will be served like usual by the actual route in server/index.js
    // const handlePageBundleRequest = async (
    //   pageBundleRes: ServerResponse,
    //   parsedPageBundleUrl: UrlObject
    // ): Promise<{ finished?: true }> => {
    //   const { pathname } = parsedPageBundleUrl
    //   const params: { path: string[] } | null = matchNextPageBundleRequest(
    //     pathname
    //   )
    //   if (!params) {
    //     return {}
    //   }
    //
    //   const page = denormalizePagePath(`/${params.path.join('/')}`)
    //   if (page === '/_error' || BLOCKED_PAGES.indexOf(page) === -1) {
    //     try {
    //       await this.ensurePath(page)
    //     } catch (error) {
    //       await renderScriptError(pageBundleRes, error)
    //       return { finished: true }
    //     }
    //
    //     const errors = await this.getCompilationErrors(page)
    //     if (errors.length > 0) {
    //       await renderScriptError(pageBundleRes, errors[0], { verbose: false })
    //       return { finished: true }
    //     }
    //   }
    //
    //   return {}
    // }
    //
    // const { finished } = await handlePageBundleRequest(res, parsedUrl)

    for (const fn of this.middlewares) {
      await new Promise<void>((resolve, reject) => {
        fn(req, res, (err: Error) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // return { finished }
    return {};
  }

  private async clean(): Promise<void> {
    await recursiveDelete(
      this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir),
      /^cache/
    );
  }

  private async getWebpackConfig() {
    const pagePaths = await Promise.all([
      findPageFile(this.pagesDir, "/_app", this.joyAppConfig.pageExtensions),
      findPageFile(
        this.pagesDir,
        "/_document",
        this.joyAppConfig.pageExtensions
      ),
    ]);

    const routes = () => {
      return this.joyReactRouter.getRoutes();
    };

    const pages = createPagesMapping(
      pagePaths.filter((i) => i !== null) as string[],
      this.joyAppConfig.pageExtensions
    );
    const buildId = await this.buildConfig.getBuildId();
    const previewProps = this.getPreviewProps();
    const customRoutes = await loadCustomRoutes(this.joyAppConfig);
    const { redirects, rewrites, headers } = customRoutes;

    const entrypoints = createEntrypoints(
      pages,
      "server",
      buildId,
      previewProps,
      this.joyAppConfig,
      []
    );

    const additionalClientEntrypoints: { [file: string]: string } = {};
    additionalClientEntrypoints[CLIENT_STATIC_FILES_RUNTIME_AMP] =
      `./` +
      relativePath(
        this.dir,
        join(NEXT_PROJECT_ROOT_DIST_CLIENT, "dev", "amp-dev")
      ).replace(/\\/g, "/");

    additionalClientEntrypoints[
      CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH
    ] = require.resolve(`@next/react-refresh-utils/runtime`);

    return Promise.all([
      getBaseWebpackConfig(this.dir, {
        dev: true,
        isServer: false,
        config: this.joyAppConfig,
        buildId,
        pagesDir: this.pagesDir,
        rewrites: rewrites,
        routes,
        entrypoints: { ...entrypoints.client, ...additionalClientEntrypoints },
      }),
      getBaseWebpackConfig(this.dir, {
        dev: true,
        isServer: true,
        config: this.joyAppConfig,
        buildId,
        pagesDir: this.pagesDir,
        rewrites: rewrites,
        routes,
        entrypoints: { ...entrypoints.server },
      }),
    ]);
  }

  public async start(): Promise<void> {
    await this.clean();
    await this.fileGenerator.mkTempDirs();

    const _configs = await this.getWebpackConfig();

    for (const config of _configs) {
      const defaultEntry = config.entry;
      config.entry = async (...args) => {
        // @ts-ignore entry is always a functon
        const entrypoints = await defaultEntry(...args);
        const isClientCompilation = config.name === "client";

        // 加载动态生成的文件
        // if( existsSync(this.config.resolveAppDir(this.config.outDir, 'dist/src'))) {
        //     entrypoints[''] = 'bbb'
        // }

        await Promise.all(
          Object.keys(entries).map(async (page) => {
            if (isClientCompilation && page.match(API_ROUTE)) {
              return;
            }
            const {
              serverBundlePath,
              clientBundlePath,
              absolutePagePath,
            } = entries[page];
            const pageExists = await isWriteable(absolutePagePath);
            if (!pageExists) {
              // page was removed
              delete entries[page];
              return;
            }

            entries[page].status = BUILDING;
            const pageLoaderOpts: ClientPagesLoaderOptions = {
              page,
              absolutePagePath,
            };

            entrypoints[
              isClientCompilation ? clientBundlePath : serverBundlePath
            ] = isClientCompilation
              ? `next-client-pages-loader?${stringify(pageLoaderOpts)}!`
              : absolutePagePath;
          })
        );

        return entrypoints;
      };
    }

    const [clientConfig, serverConfig] = _configs;
    const srcConfig = await getWebpackConfigForSrc(
      serverConfig,
      this.joyAppConfig
    );
    const configs = [clientConfig, serverConfig, srcConfig];
    const multiCompiler = webpack(configs);

    watchCompilers(multiCompiler.compilers[0], multiCompiler.compilers[1]);

    // This plugin watches for changes to _document.js and notifies the client side that it should reload the page
    multiCompiler.compilers[2].hooks.failed.tap(
      "JoyJSHotReloaderForSrc",
      (err: Error) => {
        console.log(err);
      }
    );
    multiCompiler.compilers[2].hooks.done.tap(
      "JoyJSHotReloaderForSrc",
      async (stats) => {
        //  ===== 扫描src目录
        // const distPagesDir = this.config.resolveDistPagesDir()
        // const distPagesDir = this.config.resolveAppDir(this.config.outDir, 'server', 'dist/src' )
        const distPagesDir = this.joyAppConfig.resolveAppDir(
          this.joyAppConfig.distDir,
          "dist/src"
        );
        await this.fileScanner.scan(distPagesDir);

        // ===== 重新生成客户端需要的文件，比如路由和插件配置等。
        await this.fileGenerator.generate(false);
        // if (this.watcher){
        console.log(">>>>> JoyJSHotReloaderForSrc");
        multiCompiler.compilers[0].watching.invalidate();
        multiCompiler.compilers[1].watching.invalidate();
        // this.watcher.watchings[0].invalidate()
        // this.watcher.watchings[1].invalidate()
        // }
      }
    );

    // This plugin watches for changes to _document.js and notifies the client side that it should reload the page
    multiCompiler.compilers[1].hooks.failed.tap(
      "NextjsHotReloaderForServer",
      (err: Error) => {
        this.serverError = err;
        this.serverStats = null;
      }
    );
    multiCompiler.compilers[1].hooks.done.tap(
      "NextjsHotReloaderForServer",
      async (stats) => {
        this.serverError = null;
        this.serverStats = stats;
        const { compilation } = stats;

        // We only watch `_document` for changes on the server compilation
        // the rest of the files will be triggered by the client compilation
        const documentChunk = compilation.namedChunks.get("pages/_document");
        // If the document chunk can't be found we do nothing
        if (!documentChunk) {
          console.warn("_document.js chunk not found");
          return;
        }
        // Initial value
        if (this.serverPrevDocumentHash === null) {
          this.serverPrevDocumentHash = documentChunk.hash;
          return;
        }
        // If _document.js didn't change we don't trigger a reload
        if (documentChunk.hash === this.serverPrevDocumentHash) {
          return;
        }
        // Notify reload to reload the page, as _document.js was changed (different hash)
        this.send("reloadPage");
        this.serverPrevDocumentHash = documentChunk.hash;
      }
    );

    multiCompiler.compilers[0].hooks.failed.tap(
      "NextjsHotReloaderForClient",
      (err: Error) => {
        this.clientError = err;
        this.stats = null;
      }
    );
    multiCompiler.compilers[0].hooks.done.tap(
      "NextjsHotReloaderForClient",
      (stats) => {
        this.clientError = null;
        this.stats = stats;

        const { compilation } = stats;
        const chunkNames = new Set(
          [...compilation.namedChunks.keys()].filter(
            (name) => !!getRouteFromEntrypoint(name)
          )
        );

        if (this.prevChunkNames) {
          // detect chunks which have to be replaced with a new template
          // e.g, pages/index.js <-> pages/_error.js
          const addedPages = diff(chunkNames, this.prevChunkNames!);
          const removedPages = diff(this.prevChunkNames!, chunkNames);

          if (addedPages.size > 0) {
            for (const addedPage of addedPages) {
              const page = getRouteFromEntrypoint(addedPage);
              this.send("addedPage", page);
            }
          }

          if (removedPages.size > 0) {
            for (const removedPage of removedPages) {
              const page = getRouteFromEntrypoint(removedPage);
              this.send("removedPage", page);
            }
          }
        }

        this.prevChunkNames = chunkNames;
      }
    );

    multiCompiler.hooks.done.tap("NextJsOnDemandModules", (multiStats) => {
      const [clientStats, serverStats] = multiStats.stats;
      this.doneCallbacks.emit("done", clientStats);
    });

    this.webpackHotMiddleware = new WebpackHotMiddleware(
      multiCompiler.compilers[0]
    );

    let booted = false;

    this.watcher = await new Promise((resolve) => {
      const watcher = multiCompiler.watch(
        // @ts-ignore webpack supports an array of watchOptions when using a multiCompiler
        configs.map((config) => config.watchOptions!),
        // Errors are handled separately
        (_err: any) => {
          if (_err) {
            console.error(_err);
          }
          if (!booted) {
            booted = true;
            resolve(watcher);
          }
        }
      );
    });

    // this.onDemandEntries = onDemandEntryHandler(this.watcher, multiCompiler, {
    //   pagesDir: this.pagesDir,
    //   pageExtensions: this.config.pageExtensions,
    //   ...(this.config.onDemandEntries as {
    //     maxInactiveAge: number
    //     pagesBufferLength: number
    //   }),
    // })

    this.onDemandModules = new OnDemandModuleHandler(
      this.watcher,
      multiCompiler
    );

    this.middlewares = [
      // must come before hotMiddleware
      // this.onDemandEntries.middleware,
      this.webpackHotMiddleware.middleware,
      getOverlayMiddleware({
        rootDirectory: this.dir,
        stats: () => this.stats,
        serverStats: () => this.serverStats,
      }),
    ];
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.watcher.close((err: any) => (err ? reject(err) : resolve()));
    });
  }

  public async getCompilationErrors(page: string) {
    const normalizedPage = normalizePathSep(page);

    if (this.clientError || this.serverError) {
      return [this.clientError || this.serverError];
    } else if (this.stats?.hasErrors()) {
      const { compilation } = this.stats;
      const failedPages = erroredPages(compilation);

      // If there is an error related to the requesting page we display it instead of the first error
      if (
        failedPages[normalizedPage] &&
        failedPages[normalizedPage].length > 0
      ) {
        return failedPages[normalizedPage];
      }

      // If none were found we still have to show the other errors
      return this.stats.compilation.errors;
    }

    return [];
  }

  public send(action?: string, ...args: any[]): void {
    this.webpackHotMiddleware!.publish({ action, data: args });
  }

  // public async invalidateWatcher(srcPaths?: string[]): Promise<void> {
  //   this.watcher.invalidate()
  //   // this.watcher.compiler.compilers[0].hooks.done.tap('ddd', (stats) => {
  //   //   this.clientError = null
  //   //   this.stats = stats
  //   //
  //   //
  //   // })
  //
  //   if (!srcPaths?.length) {
  //     return
  //   }
  //   const waitingCompilePaths = [...srcPaths]
  //   return new Promise(((resolve, reject) => {
  //     this.doneCallbacks.once('done', (stats: Stats) => {
  //       const { compilation } = stats
  //       const {modules} = compilation
  //       const moduleKeys = modules.keys
  //       for (const mod of modules) {
  //         const {resource} = (mod as any)
  //         if (resource ) {
  //           const idx = waitingCompilePaths.indexOf(resource)
  //           if (idx>= 0){
  //             waitingCompilePaths.splice(idx, 1)
  //           }
  //         }
  //       }
  //
  //       if (waitingCompilePaths.length === 0){
  //         resolve()
  //       }
  //
  //
  //     })
  //   }))
  // }

  public async ensureModules(moduleFilePaths: string[]) {
    return this.onDemandModules.ensureModules(moduleFilePaths);
  }

  public async ensurePath(page: string) {
    // Make sure we don't re-build or dispose prebuilt pages
    if (page !== "/_error" && BLOCKED_PAGES.indexOf(page) !== -1) {
      return;
    }
    if (this.serverError || this.clientError) {
      return Promise.reject(this.serverError || this.clientError);
    }

    const ensureFiles = await this.joyReactRouter.getRouteFiles(page);
    if (!ensureFiles || ensureFiles.length === 0) {
      return;
    }
    await this.ensureModules(ensureFiles);
  }
}

function diff(a: Set<any>, b: Set<any>) {
  return new Set([...a].filter((v) => !b.has(v)));
}
