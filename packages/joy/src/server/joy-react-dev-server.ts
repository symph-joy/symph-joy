import React from "react";
import { ReactDevOverlay } from "@next/react-dev-overlay/lib/client";
import crypto from "crypto";
import fs from "fs";
import { IncomingMessage, ServerResponse } from "http";
import AmpHtmlValidator from "amphtml-validator";
import { join as pathJoin, relative, resolve as pathResolve, sep } from "path";
import { UrlWithParsedQuery } from "url";
import Watchpack from "watchpack";
import { ampValidation } from "../build/output/index";
import * as Log from "../build/output/log";
import { PUBLIC_DIR_MIDDLEWARE_CONFLICT } from "../lib/constants";
import { fileExists } from "../lib/file-exists";
import loadCustomRoutes, { CustomRoutes } from "../lib/load-custom-routes";
import { verifyTypeScriptSetup } from "../lib/verifyTypeScriptSetup";
import { CLIENT_STATIC_FILES_PATH, DEV_CLIENT_PAGES_MANIFEST, PHASE_DEVELOPMENT_SERVER } from "../joy-server/lib/constants";
import { getRouteMatcher, getRouteRegex, isDynamicRoute } from "../joy-server/lib/router/utils";
import { __ApiPreviewProps } from "../joy-server/server/api-utils";
import { JoyReactServer } from "../joy-server/server/joy-react-server";
import { normalizePagePath } from "../joy-server/server/normalize-page-path";
import Router, { Params, route } from "../joy-server/server/router";
import HotReloader from "./hot-reloader";
import { findPageFile } from "./lib/find-page-file";
import { withCoalescedInvoke } from "../lib/coalesced-function";
import { Inject, Component, EntryType } from "@symph/core";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
// import { FileScanner } from "../build/scanner/file-scanner";
import { BuildDevConfig } from "./build-dev-config";
// import { FileGenerator } from "../build/file-generator";
import { JoyReactAppServerDevConfiguration } from "../react/joy-react-app-server-dev.configuration";
import { ReactContextFactoryDev } from "./react-context-factory-dev";
import { PagesManifest } from "../build/webpack/plugins/pages-manifest-plugin";
import { getSortedRoutes } from "@symph/react/dist/router/route-sorter";

if (typeof React.Suspense === "undefined") {
  throw new Error(
    `The version of React you are using is lower than the minimum required version needed for Joy.js. Please upgrade "react" and "react-dom": "npm install react react-dom"`
  );
}

@Component()
export class JoyReactDevServer extends JoyReactServer {
  private devReady: Promise<void>;
  private setDevReady?: Function;
  private webpackWatcher?: Watchpack | null;

  // @Inject()
  // private fileScanner: FileScanner;

  // @Inject("fileGenerator")
  // private fileGenerator: FileGenerator;

  // private hotReloader?: HotReloader;
  // private isCustomServer: boolean
  protected sortedRoutes?: string[];

  protected staticPathsWorker: import("jest-worker").Worker & {
    loadStaticPaths: typeof import("./static-paths-worker").loadStaticPaths;
  };

  // constructor(options: ServerConstructor & { isJoyDevCommand?: boolean }) {
  constructor(
    protected joyAppConfig: JoyAppConfig,
    protected buildConfig: BuildDevConfig,
    protected hotReloader: HotReloader,
    protected reactContextFactory: ReactContextFactoryDev
  ) {
    super(joyAppConfig, reactContextFactory);
    this.renderOpts.dev = true;
    (this.renderOpts as any).ErrorComponent = ReactDevOverlay;
    this.devReady = new Promise((resolve) => {
      this.setDevReady = resolve;
    });
    // (this.renderOpts as any).ampSkipValidation = this.joyConfig.experimental?.amp?.skipValidation ?? false;
    // (this.renderOpts as any).ampValidator = (html: string, pathname: string) => {
    //   const validatorPath = this.joyConfig.experimental && this.joyConfig.experimental.amp && this.joyConfig.experimental.amp.validator;
    //   return AmpHtmlValidator.getInstance(validatorPath).then((validator: any) => {
    //     const result = validator.validateString(html);
    //     ampValidation(
    //       pathname,
    //       result.errors.filter((e: any) => e.severity === "ERROR").filter((e: any) => this._filterAmpDevelopmentScript(html, e)),
    //       result.errors.filter((e: any) => e.severity !== "ERROR")
    //     );
    //   });
    // };
    if (fs.existsSync(pathJoin(this.dir, "static"))) {
      console.warn(`The static directory has been deprecated in favor of the public directory.`);
    }
    // this.isCustomServer = !appConfig.isJoyDevCommand
    // this.pagesDir = findPagesDir(this.dir)
    this.pagesDir = joyAppConfig.resolvePagesDir();
    // todo 开启worker
    // this.staticPathsWorker = new Worker(
    //   require.resolve('./static-paths-worker'),
    //   {
    //     maxRetries: 0,
    //     numWorkers: this.joyConfig.experimental.cpus,
    //     forkOptions: {
    //       env: {
    //         ...process.env,
    //         // discard --inspect/--inspect-brk flags from process.env.NODE_OPTIONS. Otherwise multiple Node.js debuggers
    //         // would be started if user launch Joy.js in debugging mode. The number of debuggers is linked to
    //         // the number of workers Joy.js tries to launch. The only worker users are interested in debugging
    //         // is the main Joy.js one
    //         NODE_OPTIONS: getNodeOptionsWithoutInspect(),
    //       },
    //     },
    //   }
    // ) as Worker & {
    //   loadStaticPaths: typeof import('./static-paths-worker').loadStaticPaths
    // }
    //
    // this.staticPathsWorker.getStdout().pipe(process.stdout)
    // this.staticPathsWorker.getStderr().pipe(process.stderr)

    this.staticPathsWorker = require("./static-paths-worker");
  }

  protected currentPhase(): string {
    return PHASE_DEVELOPMENT_SERVER;
  }

  protected async readBuildId(): Promise<string> {
    // return 'development'
    return this.buildConfig.getBuildId();
  }

  async addExportPathMapRoutes() {
    // Makes `joy export` exportPathMap work in development mode.
    // So that the user doesn't have to define a custom server reading the exportPathMap
    if (this.joyConfig.exportPathMap) {
      console.log("Defining routes from exportPathMap");
      const exportPathMap = await this.joyConfig.exportPathMap(
        {},
        {
          dev: true,
          dir: this.dir,
          outDir: null,
          distDir: this.outDir,
          buildId: this.buildId,
        }
      ); // In development we can't give a default path mapping
      for (const path in exportPathMap) {
        const { page, query = {} } = exportPathMap[path];

        // We use unshift so that we're sure the routes is defined before Joy's default routes
        this.router.addFsRoute({
          match: route(path),
          type: "route",
          name: `${path} exportpathmap route`,
          fn: async (req, res, _params, parsedUrl) => {
            const { query: urlQuery } = parsedUrl;

            Object.keys(urlQuery)
              .filter((key) => query[key] === undefined)
              .forEach((key) => console.warn(`Url '${path}' defines a query parameter '${key}' that is missing in exportPathMap`));

            const mergedQuery = { ...urlQuery, ...query };

            await this.render(req, res, page, mergedQuery, parsedUrl);
            return {
              finished: true,
            };
          },
        });
      }
    }
  }

  async startWatcher(): Promise<void> {
    if (this.webpackWatcher) {
      return;
    }

    const regexPageExtension = new RegExp(`\\.+(?:${this.joyConfig.pageExtensions.join("|")})$`);

    let resolved = false;
    return new Promise((resolve, reject) => {
      const pagesDir = this.pagesDir;

      // Watchpack doesn't emit an event for an empty directory
      fs.readdir(pagesDir!, (_, files) => {
        if (files?.length) {
          return;
        }

        if (!resolved) {
          resolve();
          resolved = true;
        }
      });

      const wp = (this.webpackWatcher = new Watchpack({}));
      wp.watch([], [pagesDir!], 0);

      wp.on("aggregated", () => {
        const routedPages = [];
        // @ts-ignore
        const knownFiles = wp.getTimeInfoEntries();
        for (const [fileName, { accuracy }] of knownFiles) {
          if (accuracy === undefined || !regexPageExtension.test(fileName)) {
            continue;
          }

          let pageName = "/" + relative(pagesDir!, fileName).replace(/\\+/g, "/");
          pageName = pageName.replace(regexPageExtension, "");
          pageName = pageName.replace(/\/index$/, "") || "/";

          routedPages.push(pageName);
        }

        try {
          // we serve a separate manifest with all pages for the client in
          // dev mode so that we can match a page after a rewrite on the client
          // before it has been built and is populated in the _buildManifest
          const sortedRoutes = getSortedRoutes(routedPages);

          if (!this.sortedRoutes?.every((val, idx) => val === sortedRoutes[idx])) {
            // emit the change so clients fetch the update
            this.hotReloader!.send(undefined, { devPagesManifest: true });
          }
          this.sortedRoutes = sortedRoutes;

          this.dynamicRoutes = this.sortedRoutes.filter(isDynamicRoute).map((page) => ({
            page,
            match: getRouteMatcher(getRouteRegex(page)),
          }));

          this.router.setDynamicRoutes(this.dynamicRoutes);

          if (!resolved) {
            resolve();
            resolved = true;
          }
        } catch (e) {
          if (!resolved) {
            reject(e);
            resolved = true;
          } else {
            console.warn("Failed to reload dynamic routes:", e);
          }
        }
      });
    });
  }

  async stopWatcher(): Promise<void> {
    if (!this.webpackWatcher) {
      return;
    }

    this.webpackWatcher.close();
    this.webpackWatcher = null;
  }

  async prepare(): Promise<void> {
    await verifyTypeScriptSetup(this.dir, this.pagesDir!, false);

    this.customRoutes = await loadCustomRoutes(this.joyConfig);

    // reload router
    const { redirects, rewrites, headers } = this.customRoutes;
    if (redirects.length || rewrites.length || headers.length) {
      this.router = new Router(this.generateRoutes());
    }

    // this.hotReloader = new HotReloader(this.dir, {
    //   pagesDir: this.pagesDir!,
    //   config: this.joyConfig,
    //   previewProps: this.getPreviewProps(),
    //   buildId: this.buildId,
    //   rewrites: this.customRoutes.rewrites,
    //   fileScanner: this.fileScanner,
    //   fileGenerator: this.fileGenerator,
    // });
    await super.prepare();
    await this.addExportPathMapRoutes();
    await this.hotReloader.start();
    // await this.startWatcher();
    this.setDevReady!();

    // const telemetry = new Telemetry({ outDir: this.outDir })
    // telemetry.record(
    //   eventCliSession(PHASE_DEVELOPMENT_SERVER, this.outDir, {
    //     cliCommand: 'dev',
    //     isSrcDir: relative(this.dir, this.pagesDir!).startsWith('src'),
    //     hasNowJson: !!(await findUp('now.json', { cwd: this.dir })),
    //     isCustomServer: this.isCustomServer,
    //   })
    // )
  }

  public async close(): Promise<void> {
    // await this.stopWatcher();
    // await this.staticPathsWorker.end()
    // if (this.hotReloader) {
    //   await this.hotReloader.stop();
    // }
  }

  protected async hasPage(pathname: string): Promise<boolean> {
    let normalizedPath: string;

    try {
      normalizedPath = normalizePagePath(pathname);
    } catch (err) {
      console.error(err);
      // if normalizing the page fails it means it isn't valid
      // so it doesn't exist so don't throw and return false
      // to ensure we return 404 instead of 500
      return false;
    }

    const pageFile = await findPageFile(this.pagesDir!, normalizedPath, this.joyConfig.pageExtensions);
    return !!pageFile;
  }

  protected async _beforeCatchAllRender(req: IncomingMessage, res: ServerResponse, params: Params, parsedUrl: UrlWithParsedQuery): Promise<boolean> {
    const { pathname } = parsedUrl;
    const pathParts = params.path || [];
    const path = `/${pathParts.join("/")}`;
    // check for a public file, throwing error if there's a
    // conflicting page
    if (await this.hasPublicFile(path)) {
      if (await this.hasPage(pathname!)) {
        const err = new Error(`A conflicting public file and page file was found for path ${pathname}`);
        res.statusCode = 500;
        await this.renderError(err, req, res, pathname!, {});
        return true;
      }
      await this.servePublic(req, res, pathParts);
      return true;
    }

    return false;
  }

  async run(req: IncomingMessage, res: ServerResponse, parsedUrl: UrlWithParsedQuery): Promise<void> {
    await this.devReady;

    const { basePath } = this.joyConfig;
    let originalPathname: string | null = null;

    if (basePath && parsedUrl.pathname?.startsWith(basePath)) {
      // strip basePath before handling dev bundles
      // If replace ends up replacing the full url it'll be `undefined`, meaning we have to default it to `/`
      originalPathname = parsedUrl.pathname;
      parsedUrl.pathname = parsedUrl.pathname!.slice(basePath.length) || "/";
    }

    const { pathname } = parsedUrl;

    if (pathname!.startsWith("/_joy")) {
      if (await fileExists(pathJoin(this.publicDir, "_joy"))) {
        throw new Error(PUBLIC_DIR_MIDDLEWARE_CONFLICT);
      }
    }

    const { finished = false } = await this.hotReloader!.run(req, res, parsedUrl);

    if (finished) {
      return;
    }

    if (originalPathname) {
      // restore the path before continuing so that custom-routes can accurately determine
      // if they should match against the basePath or not
      parsedUrl.pathname = originalPathname;
    }

    return super.run(req, res, parsedUrl);
  }

  protected getPagesManifest(): PagesManifest {
    return {};
  }

  // override production loading of routes-manifest
  protected getCustomRoutes(): CustomRoutes {
    // actual routes will be loaded asynchronously during .prepare()
    return { redirects: [], rewrites: [], headers: [] };
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

  // protected getReactRoutes():

  generateRoutes() {
    const { fsRoutes, ...otherRoutes } = super.generateRoutes();

    // In development we expose all compiled files for react-error-overlay's line show feature
    // We use unshift so that we're sure the routes is defined before Joy's default routes
    fsRoutes.unshift({
      match: route("/_joy/development/:path*"),
      type: "route",
      name: "_joy/development catchall",
      fn: async (req, res, params) => {
        const p = pathJoin(this.outDir, ...(params.path || []));
        await this.serveStatic(req, res, p);
        return {
          finished: true,
        };
      },
    });

    fsRoutes.unshift({
      match: route(`/_joy/${CLIENT_STATIC_FILES_PATH}/${this.buildId}/${DEV_CLIENT_PAGES_MANIFEST}`),
      type: "route",
      name: `_joy/${CLIENT_STATIC_FILES_PATH}/${this.buildId}/${DEV_CLIENT_PAGES_MANIFEST}`,
      fn: async (_req, res) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            pages: this.sortedRoutes,
          })
        );
        return {
          finished: true,
        };
      },
    });

    fsRoutes.push({
      match: route("/:path*"),
      type: "route",
      requireBasePath: false,
      name: "catchall public directory route",
      fn: async (req, res, params, parsedUrl) => {
        const { pathname } = parsedUrl;
        if (!pathname) {
          throw new Error("pathname is undefined");
        }

        // Used in development to check public directory paths
        if (await this._beforeCatchAllRender(req, res, params, parsedUrl)) {
          return {
            finished: true,
          };
        }

        return {
          finished: false,
        };
      },
    });

    return { fsRoutes, ...otherRoutes };
  }

  // In development public files are not added to the router but handled as a fallback instead
  protected generatePublicRoutes(): never[] {
    return [];
  }

  // In development dynamic routes cannot be known ahead of time
  protected getDynamicRoutes(): never[] {
    return [];
  }

  _filterAmpDevelopmentScript(html: string, event: { line: number; col: number; code: string }): boolean {
    if (event.code !== "DISALLOWED_SCRIPT_TAG") {
      return true;
    }

    const snippetChunks = html.split("\n");

    let snippet;
    if (!(snippet = html.split("\n")[event.line - 1]) || !(snippet = snippet.substring(event.col))) {
      return true;
    }

    snippet = snippet + snippetChunks.slice(event.line).join("\n");
    snippet = snippet.substring(0, snippet.indexOf("</script>"));

    return !snippet.includes("data-amp-development-mode-only");
  }

  protected async getStaticPaths(pathname: string): Promise<{
    staticPaths: string[] | undefined;
    fallbackMode: false | "static" | "blocking";
  }> {
    // we lazy load the staticPaths to prevent the user
    // from waiting on them for the page to load in dev mode

    const __getStaticPaths = async () => {
      const { publicRuntimeConfig, serverRuntimeConfig } = this.joyConfig;

      const paths = await this.staticPathsWorker.loadStaticPaths(this.outDir, pathname, !this.renderOpts.dev && this._isLikeServerless, {
        publicRuntimeConfig,
        serverRuntimeConfig,
      });
      return paths;
    };
    const { paths: staticPaths, fallback } = (await withCoalescedInvoke(__getStaticPaths)(`staticPaths-${pathname}`, [])).value as any;

    return {
      staticPaths,
      fallbackMode: fallback === "unstable_blocking" ? "blocking" : fallback === true ? "static" : false,
    };
  }

  protected async ensureApiPage(pathname: string) {
    return this.hotReloader!.ensurePath(pathname);
  }

  // public async invalidateCompilerWatcher(srcPaths: string[]): Promise<void> {
  //   return this.hotReloader?.invalidateWatcher(srcPaths)
  // }

  public async ensureModules(moduleFilePaths: string[]) {
    return this.hotReloader?.ensureModules(moduleFilePaths);
  }

  protected getReactAppProviderConfig(): EntryType[] {
    return [JoyReactAppServerDevConfiguration];
  }

  // protected async getReactAppContext(
  //   req: IncomingMessage,
  //   res: ServerResponse,
  //   pathname: string,
  //   query: ParsedUrlQuery
  // ): Promise<ReactApplicationContext> {
  //   const context = await super.getReactAppContext(req, res, pathname, query);
  //   // todo 实现ensurePath相关的方法，当req相关的路由component编译完成后，才会开始渲染页面。
  //   return context;
  // }

  async renderToHTML(req: IncomingMessage, res: ServerResponse, pathname: string, query: { [key: string]: string }): Promise<string | null> {
    await this.devReady;

    await this.hotReloader.ensurePath(pathname);

    const compilationErr = await this.getCompilationError(pathname);
    if (compilationErr) {
      res.statusCode = 500;
      return this.renderErrorToHTML(compilationErr, req, res, pathname, query);
    }

    // // In dev mode we use on demand entries to compile the page before rendering
    // try {
    //   await this.hotReloader!.ensurePath(pathname).catch(async (err: Error) => {
    //     if ((err as any).code !== 'ENOENT') {
    //       throw err
    //     }
    //
    //     for (const dynamicRoute of this.dynamicRoutes || []) {
    //       const params = dynamicRoute.match(pathname)
    //       if (!params) {
    //         continue
    //       }
    //
    //       return this.hotReloader!.ensurePath(dynamicRoute.page)
    //     }
    //     throw err
    //   })
    // } catch (err) {
    //   if (err.code === 'ENOENT') {
    //     try {
    //       await this.hotReloader!.ensurePath('/404')
    //     } catch (hotReloaderError) {
    //       if (hotReloaderError.code !== 'ENOENT') {
    //         throw hotReloaderError
    //       }
    //     }
    //
    //     res.statusCode = 404
    //     return this.renderErrorToHTML(null, req, res, pathname, query)
    //   }
    //   if (!this.quiet) console.error(err)
    // }
    const html = await super.renderToHTML(req, res, pathname, query);
    return html;
  }

  async renderErrorToHTML(
    err: Error | null,
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: { [key: string]: string }
  ): Promise<string | null> {
    await this.devReady;
    if (res.statusCode === 404 && (await this.hasPage("/404"))) {
      await this.hotReloader!.ensurePath("/404");
    } else {
      await this.hotReloader!.ensurePath("/_error");
    }

    const compilationErr = await this.getCompilationError(pathname);
    if (compilationErr) {
      res.statusCode = 500;
      return super.renderErrorToHTML(compilationErr, req, res, pathname, query);
    }

    if (!err && res.statusCode === 500) {
      err = new Error("An undefined error was thrown sometime during render... ");
    }

    try {
      const out = await super.renderErrorToHTML(err, req, res, pathname, query);
      return out;
    } catch (err2) {
      if (!this.quiet) Log.error(err2);
      res.statusCode = 500;
      return super.renderErrorToHTML(err2, req, res, pathname, query);
    }
  }

  sendHTML(req: IncomingMessage, res: ServerResponse, html: string): Promise<void> {
    // In dev, we should not cache pages for any reason.
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    return super.sendHTML(req, res, html);
  }

  protected setImmutableAssetCacheControl(res: ServerResponse): void {
    res.setHeader("Cache-Control", "no-store, must-revalidate");
  }

  private servePublic(req: IncomingMessage, res: ServerResponse, pathParts: string[]): Promise<void> {
    const p = pathJoin(this.publicDir, ...pathParts.map(encodeURIComponent));
    return this.serveStatic(req, res, p);
  }

  async hasPublicFile(path: string): Promise<boolean> {
    try {
      const info = await fs.promises.stat(pathJoin(this.publicDir, path));
      return info.isFile();
    } catch (_) {
      return false;
    }
  }

  async getCompilationError(page: string): Promise<any> {
    const errors = await this.hotReloader!.getCompilationErrors(page);
    if (!errors || errors.length === 0) return;

    // Return the very first error we found.
    return errors[0];
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
    const untrustedFilePath = pathResolve(decodedUntrustedFilePath);

    // don't allow null bytes anywhere in the file path
    if (untrustedFilePath.indexOf("\0") !== -1) {
      return false;
    }

    // During development mode, files can be added while the server is running.
    // Checks for .joy/out/static, .joy/out/server, static and public.
    // Note that in development .joy/server is available for error reporting purposes.
    // see `packages/joy/joy-server/server/joy-react-server.ts` for more details.
    if (
      untrustedFilePath.startsWith(pathJoin(this.outDir, "static") + sep) ||
      untrustedFilePath.startsWith(pathJoin(this.outDir, "server") + sep) ||
      untrustedFilePath.startsWith(pathJoin(this.dir, "static") + sep) ||
      untrustedFilePath.startsWith(pathJoin(this.dir, "public") + sep)
    ) {
      return true;
    }

    return false;
  }
}
