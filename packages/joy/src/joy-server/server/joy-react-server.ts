import compression from "compression";
import { existsSync, readFileSync } from "fs";
import chalk from "chalk";
import { IncomingMessage, ServerResponse } from "http";
import Proxy from "http-proxy";
import { join, relative, resolve, sep } from "path";
import { parse as parseQs, ParsedUrlQuery } from "querystring";
import { format as formatUrl, parse as parseUrl, UrlWithParsedQuery } from "url";
import { PrerenderManifest } from "../../build/joy-build.service";
import { CustomRoutes, getRedirectStatus, Header, Redirect, Rewrite, RouteType } from "../../lib/load-custom-routes";
import { withCoalescedInvoke } from "../../lib/coalesced-function";
import {
  BUILD_ID_FILE,
  CLIENT_PUBLIC_FILES_PATH,
  CLIENT_STATIC_FILES_PATH,
  CLIENT_STATIC_FILES_RUNTIME,
  PAGES_MANIFEST,
  PHASE_PRODUCTION_SERVER,
  PRERENDER_MANIFEST,
  ROUTES_MANIFEST,
  SERVER_DIRECTORY,
  SERVERLESS_DIRECTORY,
} from "../lib/constants";
import { getRouteMatcher, getRouteRegex, isDynamicRoute } from "../lib/router/utils";
import * as envConfig from "../lib/runtime-config";
import { execOnce, isResSent, JoyApiRequest, JoyApiResponse } from "../lib/utils";
import { __ApiPreviewProps } from "./api-utils";
import pathMatch from "../lib/router/utils/path-match";
import { recursiveReadDirSync } from "./lib/recursive-readdir-sync";
import { loadComponents, LoadComponentsReturnType } from "./load-components";
import { RenderOpts, RenderOptsPartial, Render } from "./render";
import { getPagePath, requireFontManifest } from "./require";
import Router, { DynamicRoutes, PageChecker, Params, route, Route } from "./router";
import prepareDestination from "../lib/router/utils/prepare-destination";
import { sendPayload } from "./send-payload";
import { serveStatic } from "./serve-static";
import { IncrementalCache } from "./incremental-cache";
import { isBlockedPage } from "./utils";
import { compile as compilePathToRegex } from "path-to-regexp";
import { loadEnvConfig } from "../../lib/load-env-config";
import "./node-polyfill-fetch";
import { PagesManifest } from "../../build/webpack/plugins/pages-manifest-plugin";
import { removePathTrailingSlash } from "../../client/normalize-trailing-slash";
import getRouteFromAssetPath from "../lib/router/utils/get-route-from-asset-path";
import { FontManifest } from "./font-utils";
import { Component, HookType, IComponentLifecycle, IHook, InjectHook } from "@symph/core";
import { JoyAppConfig } from "./joy-app-config";
import { ReactApplicationContext, ReactRouterService } from "@symph/react";
import { RouteMatch } from "@symph/react/router-dom";
import { ReactContextFactory } from "../../react/react-context-factory";
import { EnumReactAppInitStage } from "@symph/react/dist/react-app-init-stage.enum";
import { REACT_OUT_DIR } from "../../react/react-const";
import { getSortedRoutes } from "@symph/react/dist/router/route-sorter";
import { RouteSSGData } from "../lib/RouteSSGData.interface";

const getCustomRouteMatcher = pathMatch(true);

type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => void;

type FindComponentsResult = {
  components: LoadComponentsReturnType;
  query: ParsedUrlQuery;
};

export type ServerConstructor = {
  /**
   * Where the Joy project is located - @default '.'
   */
  dir?: string;
  /**
   * Hide error messages containing server information - @default false
   */
  quiet?: boolean;
  /**
   * Object what you would use in joy.config.js - @default {}
   */
  conf?: JoyAppConfig;
  dev?: boolean;
  customServer?: boolean;
};

@Component()
export class JoyReactServer implements IComponentLifecycle {
  dir: string;
  quiet: boolean;
  joyConfig: JoyAppConfig;
  distDir: string;
  outDir: string;
  pagesDir?: string;
  publicDir: string;
  hasStaticDir: boolean;
  serverBuildDir: string;
  pagesManifest?: PagesManifest;
  buildId: string;
  renderOpts: {
    initStage: EnumReactAppInitStage;
    poweredByHeader: boolean;
    buildId: string;
    generateEtags: boolean;
    runtimeConfig?: { [key: string]: any };
    assetPrefix?: string;
    apiPrefix?: string;
    canonicalBase: string;
    dev?: boolean;
    previewProps: __ApiPreviewProps;
    customServer?: boolean;
    ampOptimizerConfig?: { [key: string]: any };
    basePath: string;
    optimizeFonts: boolean;
    fontManifest: FontManifest;
    optimizeImages: boolean;
    ssr?: boolean;
  };
  private compression?: Middleware;
  private onErrorMiddleware?: ({ err }: { err: Error }) => Promise<void>;
  private renderer: Render;
  private incrementalCache: IncrementalCache;
  router: Router;
  protected dynamicRoutes?: DynamicRoutes;
  protected customRoutes: CustomRoutes;

  /**
   * 在服务端渲染html之前调用的hook
   */
  @InjectHook({ parallel: false, type: HookType.Waterfall })
  private onBeforeRender: IHook;

  // public constructor({
  //   dir = '.',
  //   quiet = false,
  //   conf = null,
  //   dev = false,
  //   customServer = true,
  // }: ServerConstructor = {}) {
  public constructor(protected joyAppConfig: JoyAppConfig, protected reactContextFactory: ReactContextFactory) {
    const { dir, quiet, dev, customServer, distDir } = joyAppConfig;
    this.dir = joyAppConfig.resolveAppDir(dir);
    this.quiet = quiet;
    const phase = this.currentPhase();
    loadEnvConfig(this.dir, dev);

    this.joyConfig = joyAppConfig;
    this.distDir = joyAppConfig.resolveAppDir(distDir);
    this.outDir = joyAppConfig.resolveAppDir(distDir, REACT_OUT_DIR);
    this.publicDir = joyAppConfig.resolveAppDir(CLIENT_PUBLIC_FILES_PATH);
    this.hasStaticDir = existsSync(join(this.dir, "static"));
    this.renderer = new Render();
    // Only serverRuntimeConfig needs the default
    // publicRuntimeConfig gets it's default in client/index.js
    const { serverRuntimeConfig = {}, publicRuntimeConfig, assetPrefix, generateEtags, compress } = this.joyConfig;
    const globalPrefix = this.joyConfig.getGlobalPrefix();

    this.renderOpts = {
      initStage: EnumReactAppInitStage.STATIC,
      poweredByHeader: this.joyConfig.poweredByHeader,
      canonicalBase: this.joyConfig.amp.canonicalBase,
      dev: this.joyConfig.dev,
      buildId: this.buildId, // will be updated in afterPropertiesSet
      generateEtags,
      // previewProps: this.getPreviewProps(),
      previewProps: {} as any, // todo remove
      customServer: customServer === true ? true : undefined,
      // ampOptimizerConfig: this.joyConfig.experimental.amp?.optimizer,
      basePath: this.joyConfig.basePath,
      optimizeFonts: this.joyConfig.experimental.optimizeFonts && !dev,
      fontManifest: this.joyConfig.experimental.optimizeFonts && !dev ? requireFontManifest(this.outDir, this._isLikeServerless) : null,
      optimizeImages: this.joyConfig.experimental.optimizeImages,
    };

    // Only the `publicRuntimeConfig` key is exposed to the client side
    // It'll be rendered as part of __JOY_DATA__ on the client side
    if (Object.keys(publicRuntimeConfig).length > 0) {
      this.renderOpts.runtimeConfig = publicRuntimeConfig;
    }

    if (compress && this.joyConfig.target === "server") {
      this.compression = compression() as Middleware;
    }

    // Initialize joy/config with the environment configuration
    envConfig.setConfig({
      serverRuntimeConfig,
      publicRuntimeConfig,
    });

    this.serverBuildDir = join(this.outDir, this._isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY);

    this.pagesManifest = this.getPagesManifest();
    this.customRoutes = this.getCustomRoutes();
    this.router = new Router(this.generateRoutes());
    this.setAssetPrefix(assetPrefix);
    this.setApiPrefix(globalPrefix);

    // call init-server middleware, this is also handled
    // individually in serverless bundles when deployed
    if (!dev && this.joyConfig.experimental.plugins) {
      const initServer = require(join(this.serverBuildDir, "init-server.js")).default;
      this.onErrorMiddleware = require(join(this.serverBuildDir, "on-error-server.js")).default;
      initServer();
    }

    this.incrementalCache = new IncrementalCache({
      dev,
      distDir: this.outDir,
      // pagesDir: join(
      //   this.outDir,
      //   this._isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY,
      //   "pages"
      // ),
      pagesDir: join(this.outDir, "prerender"),
      flushToDisk: this.joyConfig.experimental.sprFlushToDisk,
    });

    /**
     * This sets environment variable to be used at the time of SSR by head.tsx.
     * Using this from process.env allows targetting both serverless and SSR by calling
     * `process.env.__JOY_OPTIMIZE_FONTS`.
     * TODO(prateekbh@): Remove this when experimental.optimizeFonts are being clened up.
     */
    if (this.renderOpts.optimizeFonts) {
      process.env.__JOY_OPTIMIZE_FONTS = JSON.stringify(true);
    }
    if (this.renderOpts.optimizeImages) {
      process.env.__JOY_OPTIMIZE_IMAGES = JSON.stringify(true);
    }
  }

  async initialize() {
    this.buildId = await this.readBuildId();
    this.renderOpts.buildId = this.buildId;
  }

  protected currentPhase(): string {
    return PHASE_PRODUCTION_SERVER;
  }

  private logError(err: Error): void {
    if (this.onErrorMiddleware) {
      this.onErrorMiddleware({ err });
    }
    if (this.quiet) return;
    console.error(err);
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse, parsedUrl?: UrlWithParsedQuery): Promise<void> {
    // Parse url if parsedUrl not provided
    if (!parsedUrl || typeof parsedUrl !== "object") {
      const url: any = req.url;
      parsedUrl = parseUrl(url, true);
    }

    // Parse the querystring ourselves if the user doesn't handle querystring parsing
    if (typeof parsedUrl.query === "string") {
      parsedUrl.query = parseQs(parsedUrl.query);
    }

    const { basePath } = this.joyConfig;

    if (basePath && req.url?.startsWith(basePath)) {
      // store original URL to allow checking if basePath was
      // provided or not
      (req as any)._joyHadBasePath = true;
      req.url = req.url!.replace(basePath, "") || "/";
    }

    res.statusCode = 200;
    try {
      return await this.run(req, res, parsedUrl);
    } catch (err) {
      this.logError(err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }

  public getRequestHandler() {
    return this.handleRequest.bind(this);
  }

  public setAssetPrefix(prefix?: string): void {
    this.renderOpts.assetPrefix = prefix ? prefix.replace(/\/$/, "") : "";
  }

  public setApiPrefix(prefix?: string): void {
    this.renderOpts.apiPrefix = prefix ? prefix.replace(/\/$/, "") : "";
  }

  // Backwards compatibility
  public async prepare(): Promise<void> {}

  // Backwards compatibility
  public async close(): Promise<void> {}

  protected setImmutableAssetCacheControl(res: ServerResponse): void {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  protected getPagesManifest(): PagesManifest {
    const pagesManifestPath = join(this.serverBuildDir, PAGES_MANIFEST);
    return require(pagesManifestPath);
  }

  protected getCustomRoutes(): CustomRoutes {
    return require(join(this.outDir, ROUTES_MANIFEST));
  }

  private _cachedPreviewManifest: PrerenderManifest | undefined;

  protected getPrerenderManifest(): PrerenderManifest {
    if (this._cachedPreviewManifest) {
      return this._cachedPreviewManifest;
    }
    const manifest = require(join(this.outDir, PRERENDER_MANIFEST));
    return (this._cachedPreviewManifest = manifest);
  }

  protected getPreviewProps(): __ApiPreviewProps {
    return this.getPrerenderManifest().preview!;
  }

  protected generateRoutes(): {
    basePath: string;
    headers: Route[];
    rewrites: Route[];
    fsRoutes: Route[];
    redirects: Route[];
    catchAllRoute: Route;
    pageChecker: PageChecker;
    useFileSystemPublicRoutes: boolean;
    dynamicRoutes: DynamicRoutes | undefined;
  } {
    const publicRoutes = existsSync(this.publicDir) ? this.generatePublicRoutes() : [];

    const staticFilesRoute = this.hasStaticDir
      ? [
          {
            // It's very important to keep this route's param optional.
            // (but it should support as many params as needed, separated by '/')
            // Otherwise this will lead to a pretty simple DOS attack.
            match: route("/static/:path*"),
            name: "static catchall",
            fn: async (req, res, params, parsedUrl) => {
              const p = join(this.dir, "static", ...(params.path || []).map(encodeURIComponent));
              await this.serveStatic(req, res, p, parsedUrl);
              return {
                finished: true,
              };
            },
          } as Route,
        ]
      : [];

    const fsRoutes: Route[] = [
      {
        match: route("/_joy/static/:path*"),
        type: "route",
        name: "_joy/static catchall",
        fn: async (req, res, params, parsedUrl) => {
          // make sure to 404 for /_joy/static itself
          if (!params.path) {
            await this.render404(req, res, parsedUrl);
            return {
              finished: true,
            };
          }

          if (
            params.path[0] === CLIENT_STATIC_FILES_RUNTIME ||
            params.path[0] === "chunks" ||
            params.path[0] === "css" ||
            params.path[0] === "media" ||
            params.path[0] === this.buildId ||
            params.path[0] === "pages" ||
            params.path[1] === "pages"
          ) {
            this.setImmutableAssetCacheControl(res);
          }
          const p = join(this.outDir, CLIENT_STATIC_FILES_PATH, ...(params.path || []));
          await this.serveStatic(req, res, p, parsedUrl);
          return {
            finished: true,
          };
        },
      },
      {
        match: route("/_joy/data/:path*"),
        type: "route",
        name: "_joy/data catchall",
        fn: async (req, res, params, _parsedUrl) => {
          // Make sure to 404 for /_joy/data/ itself and
          // we also want to 404 if the buildId isn't correct
          if (!params.path || params.path[0] !== this.buildId) {
            await this.render404(req, res, _parsedUrl);
            return {
              finished: true,
            };
          }
          // remove buildId from URL
          params.path.shift();

          // show 404 if it doesn't end with .json
          if (!params.path[params.path.length - 1].endsWith(".json")) {
            await this.render404(req, res, _parsedUrl);
            return {
              finished: true,
            };
          }

          // re-create page's pathname
          const pathname = getRouteFromAssetPath(
            `/${params.path
              // we need to re-encode the params since they are decoded
              // by path-match and we are re-building the URL
              .map((param: string) => encodeURIComponent(param))
              .join("/")}`,
            ".json"
          );

          const parsedUrl = parseUrl(pathname, true);

          await this.render(req, res, pathname, { ..._parsedUrl.query, _joyDataReq: "1" }, parsedUrl);
          return {
            finished: true,
          };
        },
      },
      {
        match: route("/_joy/:path*"),
        type: "route",
        name: "_joy catchall",
        // This path is needed because `render()` does a check for `/_joy` and the calls the routing again
        fn: async (req, res, _params, parsedUrl) => {
          await this.render404(req, res, parsedUrl);
          return {
            finished: true,
          };
        },
      },
      ...publicRoutes,
      ...staticFilesRoute,
    ];

    const getCustomRouteBasePath = (r: { basePath?: false }) => {
      return r.basePath !== false && this.renderOpts.dev ? this.joyConfig.basePath : "";
    };

    const getCustomRoute = (r: Rewrite | Redirect | Header, type: RouteType) =>
      ({
        ...r,
        type,
        match: getCustomRouteMatcher(`${getCustomRouteBasePath(r)}${r.source}`),
        name: type,
        fn: async (_req, _res, _params, _parsedUrl) => ({ finished: false }),
      } as Route & Rewrite & Header);

    const updateHeaderValue = (value: string, params: Params): string => {
      if (!value.includes(":")) {
        return value;
      }

      for (const key of Object.keys(params)) {
        if (value.includes(`:${key}`)) {
          value = value
            .replace(new RegExp(`:${key}\\*`, "g"), `:${key}--ESCAPED_PARAM_ASTERISKS`)
            .replace(new RegExp(`:${key}\\?`, "g"), `:${key}--ESCAPED_PARAM_QUESTION`)
            .replace(new RegExp(`:${key}\\+`, "g"), `:${key}--ESCAPED_PARAM_PLUS`)
            .replace(new RegExp(`:${key}(?!\\w)`, "g"), `--ESCAPED_PARAM_COLON${key}`);
        }
      }
      value = value
        .replace(/(:|\*|\?|\+|\(|\)|\{|\})/g, "\\$1")
        .replace(/--ESCAPED_PARAM_PLUS/g, "+")
        .replace(/--ESCAPED_PARAM_COLON/g, ":")
        .replace(/--ESCAPED_PARAM_QUESTION/g, "?")
        .replace(/--ESCAPED_PARAM_ASTERISKS/g, "*");

      // the value needs to start with a forward-slash to be compiled
      // correctly
      return compilePathToRegex(`/${value}`, { validate: false })(params).substr(1);
    };

    // Headers come very first
    const headers = this.customRoutes.headers.map((r) => {
      const headerRoute = getCustomRoute(r, "header");
      return {
        match: headerRoute.match,
        type: headerRoute.type,
        name: `${headerRoute.type} ${headerRoute.source} header route`,
        fn: async (_req, res, params, _parsedUrl) => {
          const hasParams = Object.keys(params).length > 0;

          for (const header of (headerRoute as Header).headers) {
            let { key, value } = header;
            if (hasParams) {
              key = updateHeaderValue(key, params);
              value = updateHeaderValue(value, params);
            }
            res.setHeader(key, value);
          }
          return { finished: false };
        },
      } as Route;
    });

    const redirects = this.customRoutes.redirects.map((redirect) => {
      const redirectRoute = getCustomRoute(redirect, "redirect");
      return {
        type: redirectRoute.type,
        match: redirectRoute.match,
        statusCode: redirectRoute.statusCode,
        name: `Redirect route`,
        fn: async (_req, res, params, parsedUrl) => {
          const { parsedDestination } = prepareDestination(
            redirectRoute.destination,
            params,
            parsedUrl.query,
            false,
            getCustomRouteBasePath(redirectRoute)
          );
          const updatedDestination = formatUrl(parsedDestination);

          res.setHeader("Location", updatedDestination);
          res.statusCode = getRedirectStatus(redirectRoute as Redirect);

          // Since IE11 doesn't support the 308 header add backwards
          // compatibility using refresh header
          if (res.statusCode === 308) {
            res.setHeader("Refresh", `0;url=${updatedDestination}`);
          }

          res.end();
          return {
            finished: true,
          };
        },
      } as Route;
    });

    const rewrites = this.customRoutes.rewrites.map((rewrite) => {
      const rewriteRoute = getCustomRoute(rewrite, "rewrite");
      return {
        ...rewriteRoute,
        check: true,
        type: rewriteRoute.type,
        name: `Rewrite route`,
        match: rewriteRoute.match,
        fn: async (req, res, params, parsedUrl) => {
          const { newUrl, parsedDestination } = prepareDestination(
            rewriteRoute.destination,
            params,
            parsedUrl.query,
            true,
            getCustomRouteBasePath(rewriteRoute)
          );

          // external rewrite, proxy it
          if (parsedDestination.protocol) {
            const target = formatUrl(parsedDestination);
            const proxy = new Proxy({
              target,
              changeOrigin: true,
              ignorePath: true,
            });
            proxy.web(req, res);

            proxy.on("error", (err: Error) => {
              console.error(`Error occurred proxying ${target}`, err);
            });
            return {
              finished: true,
            };
          }
          (req as any)._joyRewroteUrl = newUrl;
          (req as any)._joyDidRewrite = (req as any)._joyRewroteUrl !== req.url;

          return {
            finished: false,
            pathname: newUrl,
            query: parsedDestination.query,
          };
        },
      } as Route;
    });

    const catchAllRoute: Route = {
      match: route("/:path*"),
      type: "route",
      name: "Catchall render",
      fn: async (req, res, params, parsedUrl) => {
        let { pathname } = parsedUrl;
        const { query } = parsedUrl;
        if (!pathname) {
          throw new Error("pathname is undefined");
        }

        // joy.js core assumes page path without trailing slash
        pathname = removePathTrailingSlash(pathname);

        if (params?.path?.[0] === "api") {
          const handled = await this.handleApiRequest(req as JoyApiRequest, res as JoyApiResponse, pathname, query);
          if (handled) {
            return { finished: true };
          }
        }

        await this.render(req, res, pathname, query, parsedUrl);
        return {
          finished: true,
        };
      },
    };

    const { useFileSystemPublicRoutes } = this.joyConfig;

    if (useFileSystemPublicRoutes) {
      this.dynamicRoutes = this.getDynamicRoutes();
    }

    return {
      headers,
      fsRoutes,
      rewrites,
      redirects,
      catchAllRoute,
      useFileSystemPublicRoutes,
      dynamicRoutes: this.dynamicRoutes,
      basePath: this.joyConfig.basePath,
      pageChecker: this.hasPage.bind(this),
    };
  }

  private async getPagePath(pathname: string): Promise<string> {
    return getPagePath(
      pathname,
      this.outDir
      // this._isLikeServerless,
      // this.renderOpts.dev
    );
  }

  protected async hasPage(pathname: string): Promise<boolean> {
    let found = false;
    try {
      found = !!(await this.getPagePath(pathname));
    } catch (_) {}

    return found;
  }

  protected async _beforeCatchAllRender(
    _req: IncomingMessage,
    _res: ServerResponse,
    _params: Params,
    _parsedUrl: UrlWithParsedQuery
  ): Promise<boolean> {
    return false;
  }

  // Used to build API page in development
  protected async ensureApiPage(_pathname: string): Promise<void> {}

  /**
   * Resolves `API` request, in development builds on demand
   * @param req http request
   * @param res http response
   * @param pathname path of request
   */
  private async handleApiRequest(req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery): Promise<boolean> {
    let page = pathname;
    let params: Params | boolean = false;
    let pageFound = await this.hasPage(page);

    if (!pageFound && this.dynamicRoutes) {
      for (const dynamicRoute of this.dynamicRoutes) {
        params = dynamicRoute.match(pathname);
        if (dynamicRoute.page.startsWith("/api") && params) {
          page = dynamicRoute.page;
          pageFound = true;
          break;
        }
      }
    }

    if (!pageFound) {
      return false;
    }
    // Make sure the page is built before getting the path
    // or else it won't be in the manifest yet
    await this.ensureApiPage(page);

    let builtPagePath;
    try {
      builtPagePath = await this.getPagePath(page);
    } catch (err) {
      if (err.code === "ENOENT") {
        return false;
      }
      throw err;
    }

    const pageModule = require(builtPagePath);
    query = { ...query, ...params };

    if (!this.renderOpts.dev && this._isLikeServerless) {
      if (typeof pageModule.default === "function") {
        prepareServerlessUrl(req, query);
        await pageModule.default(req, res);
        return true;
      }
    }

    // await apiResolver(
    //   req,
    //   res,
    //   query,
    //   pageModule,
    //   this.renderOpts.previewProps,
    //   false,
    //   this.onErrorMiddleware
    // )
    return true;
  }

  protected generatePublicRoutes(): Route[] {
    const publicFiles = new Set(recursiveReadDirSync(this.publicDir).map((p) => p.replace(/\\/g, "/")));

    return [
      {
        match: route("/:path*"),
        name: "public folder catchall",
        fn: async (req, res, params, parsedUrl) => {
          const pathParts: string[] = params.path || [];
          const { basePath } = this.joyConfig;

          // if basePath is defined require it be present
          if (basePath) {
            if (pathParts[0] !== basePath.substr(1)) return { finished: false };
            pathParts.shift();
          }

          const path = `/${pathParts.join("/")}`;

          if (publicFiles.has(path)) {
            await this.serveStatic(
              req,
              res,
              // we need to re-encode it since send decodes it
              join(this.publicDir, ...pathParts.map(encodeURIComponent)),
              parsedUrl
            );
            return {
              finished: true,
            };
          }
          return {
            finished: false,
          };
        },
      } as Route,
    ];
  }

  protected getDynamicRoutes() {
    return getSortedRoutes(Object.keys(this.pagesManifest!))
      .filter(isDynamicRoute)
      .map((page) => ({
        page,
        match: getRouteMatcher(getRouteRegex(page)),
      }));
  }

  private handleCompression(req: IncomingMessage, res: ServerResponse): void {
    if (this.compression) {
      this.compression(req, res, () => {});
    }
  }

  protected async run(req: IncomingMessage, res: ServerResponse, parsedUrl: UrlWithParsedQuery): Promise<void> {
    this.handleCompression(req, res);

    try {
      const matched = await this.router.execute(req, res, parsedUrl);
      if (matched) {
        return;
      }
    } catch (err) {
      if (err.code === "DECODE_FAILED") {
        res.statusCode = 400;
        return this.renderError(null, req, res, "/_error", {});
      }
      throw err;
    }

    await this.render404(req, res, parsedUrl);
  }

  protected async sendHTML(req: IncomingMessage, res: ServerResponse, html: string): Promise<void> {
    const { generateEtags, poweredByHeader } = this.renderOpts;
    return sendPayload(req, res, html, "html", {
      generateEtags,
      poweredByHeader,
    });
  }

  public async render(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery = {},
    parsedUrl?: UrlWithParsedQuery
  ): Promise<void> {
    if (!pathname.startsWith("/")) {
      console.warn(`Cannot render page with path "${pathname}", did you mean "/${pathname}"?. #render-no-starting-slash`);
    }

    if (this.renderOpts.customServer && pathname === "/index" && !(await this.hasPage("/index"))) {
      // maintain backwards compatibility for custom server
      // (see custom-server integration tests)
      pathname = "/";
    }

    const url: any = req.url;

    // we allow custom servers to call render for all URLs
    // so check if we need to serve a static _joy file or not.
    // we don't modify the URL for _joy/data request but still
    // call render so we special case this to prevent an infinite loop
    if (!query._joyDataReq && (url.match(/^\/_joy\//) || (this.hasStaticDir && url.match(/^\/static\//)))) {
      return this.handleRequest(req, res, parsedUrl);
    }

    if (isBlockedPage(pathname)) {
      return this.render404(req, res, parsedUrl);
    }

    const html = await this.renderToHTML(req, res, pathname, query);
    // Request was ended by the user
    if (html === null) {
      return;
    }

    return this.sendHTML(req, res, html);
  }

  private async findPageComponents(pathname: string, query: ParsedUrlQuery = {}, params: Params | null = null): Promise<FindComponentsResult | null> {
    const paths = [
      // try serving a static AMP version first
      // query.amp ? normalizePagePath(pathname) + ".amp" : null,
      pathname,
    ].filter(Boolean);
    for (const routePath of paths) {
      try {
        const components = await loadComponents(this.outDir, routePath!, !this.renderOpts.dev && this._isLikeServerless);
        return {
          components,
          // query: {
          //   ...(components.getStaticProps
          //     ? {_joyDataReq: query._joyDataReq, amp: query.amp}
          //     : query),
          //   ...(params || {}),
          query: {
            ...query,
            ...(params || {}),
          },
        };
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
    }
    return null;
  }

  protected async getStaticPaths(pathname: string): Promise<{
    staticPaths: string[] | undefined;
    fallbackMode: "static" | "blocking" | false;
  }> {
    // `staticPaths` is intentionally set to `undefined` as it should've
    // been caught when checking disk data.
    const staticPaths = undefined;

    // Read whether or not fallback should exist from the manifest.
    const fallbackField = this.getPrerenderManifest().dynamicRoutes[pathname].fallback;

    return {
      staticPaths,
      fallbackMode: typeof fallbackField === "string" ? "static" : fallbackField === null ? "blocking" : false,
    };
  }

  private async renderToHTMLWithComponents(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string, // route pathname
    reactAppContext: ReactApplicationContext | undefined,
    { components, query }: FindComponentsResult,
    opts: RenderOptsPartial
  ): Promise<string | null> {
    // we need to ensure the status code if /404 is visited directly
    if (pathname === "/404") {
      res.statusCode = 404;
    }

    // handle static page
    // if (typeof components.Component === 'string') {
    //   return components.Component
    // }

    // check request state
    // const isLikeServerless =
    //   typeof components.Component === 'object' &&
    //   typeof (components.Component as any).renderReqToHTML === 'function'
    // const isSSG = !!components.getStaticProps
    // const isServerProps = !!components.getServerSideProps
    // const hasStaticPaths = !!components.getStaticPaths

    // todo 支持ssg
    const isSSG = true;
    const isServerProps = true;
    const hasStaticPaths = false;

    if (!query.amp) {
      delete query.amp;
    }

    // Toggle whether or not this is a Data request
    const isDataReq = !!query._joyDataReq;
    delete query._joyDataReq;

    // let previewData: string | false | object | undefined
    // let isPreviewMode = false
    //
    // if (isServerProps || isSSG) {
    //   previewData = tryGetPreviewData(req, res, this.renderOpts.previewProps)
    //   isPreviewMode = previewData !== false
    // }

    // Compute the iSSG cache key. We use the rewroteUrl since
    // pages with fallback: false are allowed to be rewritten to
    // and we need to look up the path by the rewritten path
    let urlPathname = (req as any)._joyRewroteUrl ? (req as any)._joyRewroteUrl : `${parseUrl(req.url || "").pathname!}`;

    // remove trailing slash
    urlPathname = urlPathname.replace(/(?!^)\/$/, "");

    // remove /_joy/data prefix from urlPathname so it matches
    // for direct page visit and /_joy/data visit
    if (isDataReq && urlPathname.includes(this.buildId)) {
      urlPathname = (urlPathname.split(this.buildId).pop() || "/").replace(/\.json$/, "").replace(/\/index$/, "/");
    }

    const matchedRoutes = ((opts as any).matchedRoutes as RouteMatch[]) || [];
    // const isIndexPage = matchedRoutes[matchedRoutes.length - 1]?.route.index;
    const ssgCacheKey = !isSSG ? undefined : urlPathname;

    // Complete the response with cached data if its present
    const cachedData = ssgCacheKey ? await this.incrementalCache.get(ssgCacheKey) : undefined;
    if (cachedData) {
      const data = isDataReq ? JSON.stringify(cachedData.pageData) : cachedData.html;

      sendPayload(
        req,
        res,
        data,
        isDataReq ? "json" : "html",
        {
          generateEtags: this.renderOpts.generateEtags,
          poweredByHeader: this.renderOpts.poweredByHeader,
        },
        !this.renderOpts.dev
          ? {
              private: false,
              stateful: false, // GSP response
              revalidate:
                cachedData.curRevalidate !== undefined
                  ? cachedData.curRevalidate
                  : /* default to minimum revalidate (this should be an invariant) */ 1,
            }
          : undefined
      );

      // Stop the request chain here if the data we sent was up-to-date
      if (!cachedData.isStale) {
        return null;
      }
    }

    // If we're here, that means data is missing or it's stale.
    const maybeCoalesceInvoke = ssgCacheKey
      ? (fn: any) => withCoalescedInvoke(fn).bind(null, ssgCacheKey, [])
      : (fn: any) => async () => {
          const value = await fn();
          return { isOrigin: true, value };
        };

    const doRender = maybeCoalesceInvoke(
      async (): Promise<{
        html: string | null;
        routesData: any[];
        // sprRevalidate: number | false;
      }> => {
        // let pageData: any
        // let html: string | null
        // let sprRevalidate: number | false
        //
        // let renderResult
        // handle serverless
        // if (isLikeServerless) {
        //   renderResult = await (components.Component as any).renderReqToHTML(
        //     req,
        //     res,
        //     'passthrough',
        //     {
        //       fontManifest: this.renderOpts.fontManifest,
        //     }
        //   )
        //
        //   html = renderResult.html
        //   pageData = renderResult.renderOpts.pageData
        //   sprRevalidate = renderResult.renderOpts.revalidate
        // } else {
        // const applicationConfig = new ApplicationConfig();
        // const joyContainer = new ApplicationContainer();
        // const reactApplicationContext = new ReactApplicationContext(
        //   {},
        //   applicationConfig,
        //   joyContainer
        // );
        // await reactApplicationContext.init();
        // // const fileScanner = await reactApplicationContext.get<FileScanner>(FileScanner)
        // // await fileScanner!.scan(this.joyAppConfig.resolveAppDir(this.joyAppConfig.outDir, 'dist/src'))
        // // await fileScanner!.scan(this.joyAppConfig.resolveAppDir(this.joyAppConfig.outDir, this.joyAppConfig.autoGenOutputDir))
        // const autoGenModules = components.autoGenModules
        // await reactApplicationContext.loadModule([
        //     ...autoGenModules!,
        //   {reactRouterProps: {type: Object, useValue: {location: '/hello2'}}}, // StaticRouter props
        //   ...this.getReactAppProviderConfig(),
        //   ]
        // )

        const renderOpts: RenderOpts = {
          ...components,
          ...opts,
          isDataReq,
          ssr: this.joyConfig.ssr,
          reactApplicationContext: reactAppContext,
        };
        const renderResult = await this.renderer.renderToHTML(req, res, pathname, query, renderOpts);

        const html = renderResult;
        // TODO: change this to a different passing mechanism
        const routesData = (renderOpts as any).routesSSGData;
        const revalidate = (renderOpts as any).revalidate;
        // }

        return { html, routesData };
      }
    );

    const isProduction = !this.renderOpts.dev;
    const isDynamicPathname = isDynamicRoute(pathname);
    const didRespond = isResSent(res);

    const { staticPaths, fallbackMode } = hasStaticPaths ? await this.getStaticPaths(pathname) : { staticPaths: undefined, fallbackMode: false };

    // When we did not respond from cache, we need to choose to block on
    // rendering or return a skeleton.
    //
    // * Data requests always block.
    //
    // * Blocking mode fallback always blocks.
    //
    // * Preview mode toggles all pages to be resolved in a blocking manner.
    //
    // * Non-dynamic pages should block (though this is an impossible
    //   case in production).
    //
    // * Dynamic pages should return their skeleton if not defined in
    //   getStaticPaths, then finish the data request on the client-side.
    //
    if (
      fallbackMode !== "blocking" &&
      ssgCacheKey &&
      !didRespond &&
      // !isPreviewMode &&
      isDynamicPathname &&
      // Development should trigger fallback when the path is not in
      // `getStaticPaths`
      (isProduction || !staticPaths || !staticPaths.includes(urlPathname))
    ) {
      if (
        // In development, fall through to render to handle missing
        // getStaticPaths.
        (isProduction || staticPaths) &&
        // When fallback isn't present, abort this render so we 404
        fallbackMode !== "static"
      ) {
        throw new NoFallbackError();
      }

      if (!isDataReq) {
        let html: string;

        // Production already emitted the fallback as static HTML.
        if (isProduction) {
          html = await this.incrementalCache.getFallback(pathname);
        }
        // We need to generate the fallback on-demand for development.
        else {
          query.__joyFallback = "true";
          // if (isLikeServerless) {
          //   prepareServerlessUrl(req, query)
          // }
          const { value: renderResult } = await doRender();
          html = renderResult.html;
        }

        sendPayload(req, res, html, "html", {
          generateEtags: this.renderOpts.generateEtags,
          poweredByHeader: this.renderOpts.poweredByHeader,
        });
        return null;
      }
    }

    const {
      isOrigin,
      value: { html, routesData },
    } = await doRender();
    let resHtml = html;
    let sprRevalidate: boolean | number = Number.MAX_SAFE_INTEGER;
    // Update the cache if the head request and cacheable
    if (isOrigin && isSSG) {
      if (routesData?.length) {
        for (const routeData of routesData as RouteSSGData[]) {
          const revalidate = routeData.revalidate;
          if (typeof revalidate === "number" && revalidate < sprRevalidate) {
            sprRevalidate = revalidate;
          }
        }
        sprRevalidate = sprRevalidate === Number.MAX_SAFE_INTEGER ? false : sprRevalidate;
      }
    }
    const pageData = routesData;
    if (ssgCacheKey) {
      await this.incrementalCache.set(ssgCacheKey, { html: html!, pageData }, sprRevalidate);
    }

    if (!isResSent(res) && (isSSG || isDataReq || isServerProps)) {
      sendPayload(
        req,
        res,
        isDataReq ? JSON.stringify(pageData) : html,
        isDataReq ? "json" : "html",
        {
          generateEtags: this.renderOpts.generateEtags,
          poweredByHeader: this.renderOpts.poweredByHeader,
        },
        !this.renderOpts.dev || (isServerProps && !isDataReq)
          ? {
              private: false,
              stateful: !isSSG,
              revalidate: sprRevalidate,
            }
          : undefined
      );
      resHtml = null;
    }

    return resHtml;
  }

  public async renderToHTML(req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery = {}): Promise<string | null> {
    const reactAppContext = await this.reactContextFactory.getReactAppContext(req, res, pathname, query);
    const routeService = reactAppContext.getSync(ReactRouterService);
    try {
      const matchedRoutes = routeService.matchRoutes(pathname);
      if (!matchedRoutes?.length) {
        res.statusCode = 404;
        return await this.renderErrorToHTML(null, req, res, pathname, query);
      }

      const result = await this.findPageComponents("/_app", query);
      const renderOptions = {
        ...this.renderOpts,
        matchedRoutes,
      };
      await this.onBeforeRender.call({
        req,
        res,
        pathname,
        query,
        reactAppContext,
        components: result?.components,
        renderOptions,
      });
      if (res.writableEnded) {
        // todo 终止渲染，场景：在hook中已经结束响应，不用再渲染了
      }

      if (result) {
        try {
          return await this.renderToHTMLWithComponents(req, res, pathname, reactAppContext, result, renderOptions);
        } catch (err) {
          if (!(err instanceof NoFallbackError)) {
            throw err;
          }
        }
      }

      if (this.dynamicRoutes?.length) {
        // todo 使用react-routes 4 之后的动态路由后，该路由是否还有必要存在？
        throw new Error("使用react-routes 4 之后的动态路由后，dynamicRoutes路由不在需要" + JSON.stringify(this.dynamicRoutes));
        // for (const dynamicRoute of this.dynamicRoutes) {
        //   const params = dynamicRoute.match(pathname);
        //   if (!params) {
        //     continue;
        //   }
        //
        //   const dynamicRouteResult = await this.findPageComponents(dynamicRoute.page, query, params);
        //   if (dynamicRouteResult) {
        //     try {
        //       return await this.renderToHTMLWithComponents(req, res, dynamicRoute.page, reactAppContext, dynamicRouteResult, {
        //         ...this.renderOpts,
        //         params,
        //       });
        //     } catch (err) {
        //       if (!(err instanceof NoFallbackError)) {
        //         throw err;
        //       }
        //     }
        //   }
        // }
      }
      return null;
    } catch (err) {
      this.logError(err);
      res.statusCode = 500;
      return await this.renderErrorToHTML(err, req, res, pathname, query);
    }
  }

  public async renderError(
    err: Error | null,
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery = {}
  ): Promise<void> {
    res.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
    const html = await this.renderErrorToHTML(err, req, res, pathname, query);
    if (html === null) {
      return;
    }
    return this.sendHTML(req, res, html);
  }

  private customErrorNo404Warn = execOnce(() => {
    console.warn(
      chalk.bold.yellow(`Warning: `) +
        chalk.yellow(
          `You have added a custom /_error page without a custom /404 page. This prevents the 404 page from being auto statically optimized. #custom-error-no-custom-404`
        )
    );
  });

  public async renderErrorToHTML(err: Error | null, req: IncomingMessage, res: ServerResponse, _pathname: string, query: ParsedUrlQuery = {}) {
    let result: null | FindComponentsResult = null;

    const is404 = res.statusCode === 404 || (err as any).statusCode === 404;

    let reactAppContext: ReactApplicationContext | undefined;

    if (err) {
      result = await this.findPageComponents("/_error", query);
    } else {
      reactAppContext = await this.reactContextFactory.getReactAppContext(req, res, is404 ? "/404" : "/_error", query);
      result = await this.findPageComponents("/_app", query);
    }

    let html: string | null;
    try {
      try {
        html = await this.renderToHTMLWithComponents(req, res, is404 ? "/404" : "/_error", reactAppContext, result!, {
          ...result,
          ...this.renderOpts,
          err,
          // ErrorComponent,
        });
      } catch (maybeFallbackError) {
        if (maybeFallbackError instanceof NoFallbackError) {
          throw new Error("invariant: failed to render error page");
        }
        throw maybeFallbackError;
      }
    } catch (renderToHtmlError) {
      console.error(renderToHtmlError);
      res.statusCode = 500;
      html = "Internal Server Error";
    }
    return html;
  }

  public async render404(req: IncomingMessage, res: ServerResponse, parsedUrl?: UrlWithParsedQuery): Promise<void> {
    const url: any = req.url;
    const { pathname, query } = parsedUrl ? parsedUrl : parseUrl(url, true);
    res.statusCode = 404;
    return this.renderError(null, req, res, pathname!, query);
  }

  public async serveStatic(req: IncomingMessage, res: ServerResponse, path: string, parsedUrl?: UrlWithParsedQuery): Promise<void> {
    if (!this.isServeableUrl(path)) {
      return this.render404(req, res, parsedUrl);
    }

    if (!(req.method === "GET" || req.method === "HEAD")) {
      res.statusCode = 405;
      res.setHeader("Allow", ["GET", "HEAD"]);
      return this.renderError(null, req, res, path);
    }

    try {
      await serveStatic(req, res, path);
    } catch (err) {
      if (err.code === "ENOENT" || err.statusCode === 404) {
        await this.render404(req, res, parsedUrl);
      } else if (err.statusCode === 412) {
        res.statusCode = 412;
        return this.renderError(err, req, res, path);
      } else {
        throw err;
      }
    }
  }

  private _validFilesystemPathSet: Set<string> | null = null;

  private getFilesystemPaths(): Set<string> {
    if (this._validFilesystemPathSet) {
      return this._validFilesystemPathSet;
    }

    const pathUserFilesStatic = join(this.dir, "static");
    let userFilesStatic: string[] = [];
    if (this.hasStaticDir && existsSync(pathUserFilesStatic)) {
      userFilesStatic = recursiveReadDirSync(pathUserFilesStatic).map((f) => join(".", "static", f));
    }

    let userFilesPublic: string[] = [];
    if (this.publicDir && existsSync(this.publicDir)) {
      userFilesPublic = recursiveReadDirSync(this.publicDir).map((f) => join(".", "public", f));
    }

    let joyFilesStatic: string[] = [];
    joyFilesStatic = recursiveReadDirSync(join(this.outDir, "static")).map((f) => join(".", relative(this.dir, this.outDir), "static", f));

    return (this._validFilesystemPathSet = new Set<string>([...joyFilesStatic, ...userFilesPublic, ...userFilesStatic]));
  }

  protected isServeableUrl(untrustedFileUrl: string): boolean {
    // This method mimics what the version of `send` we use does:
    // 1. decodeURIComponent:
    //    https://github.com/pillarjs/send/blob/0.17.1/index.js#L989
    //    https://github.com/pillarjs/send/blob/0.17.1/index.js#L518-L522
    // 2. resolve:
    //    https://github.com/pillarjs/send/blob/de073ed3237ade9ff71c61673a34474b30e5d45b/index.js#L561

    let decodedUntrustedFilePath: string;
    try {
      // (1) Decode the URL so we have the proper file name
      decodedUntrustedFilePath = decodeURIComponent(untrustedFileUrl);
    } catch {
      return false;
    }

    // (2) Resolve "up paths" to determine real request
    const untrustedFilePath = resolve(decodedUntrustedFilePath);

    // don't allow null bytes anywhere in the file path
    if (untrustedFilePath.indexOf("\0") !== -1) {
      return false;
    }

    // Check if .joy/out/static, static and public are in the path.
    // If not the path is not available.
    if (
      (untrustedFilePath.startsWith(join(this.outDir, "static") + sep) ||
        untrustedFilePath.startsWith(join(this.dir, "static") + sep) ||
        untrustedFilePath.startsWith(join(this.dir, "public") + sep)) === false
    ) {
      return false;
    }

    // Check against the real filesystem paths
    const filesystemUrls = this.getFilesystemPaths();
    const resolved = relative(this.dir, untrustedFilePath);
    return filesystemUrls.has(resolved);
  }

  protected async readBuildId(): Promise<string> {
    const buildIdFile = join(this.outDir, BUILD_ID_FILE);
    try {
      return readFileSync(buildIdFile, "utf8").trim();
    } catch (err) {
      if (!existsSync(buildIdFile)) {
        throw new Error(
          `Could not find a valid build in the '${this.outDir}' directory! Try building your app with 'joy build' before starting the server.`
        );
      }
      throw err;
    }
  }

  protected get _isLikeServerless(): boolean {
    return this.joyConfig.target === "serverless";
  }
}

function prepareServerlessUrl(req: IncomingMessage, query: ParsedUrlQuery): void {
  const curUrl = parseUrl(req.url!, true);
  req.url = formatUrl({
    ...curUrl,
    search: undefined,
    query: {
      ...curUrl.query,
      ...query,
    },
  });
}

class NoFallbackError extends Error {}
