import chalk from "chalk";
import findUp from "find-up";
import {
  promises,
  existsSync,
  exists as existsOrig,
  readFileSync,
  writeFileSync,
} from "fs";
import Worker from "jest-worker";
import { cpus } from "os";
import { dirname, join, resolve, sep } from "path";
import { promisify } from "util";
import { AmpPageStatus, formatAmpMessages } from "../build/output/index";
import * as Log from "../build/output/log";
import createSpinner from "../build/spinner";
import { API_ROUTE, SSG_FALLBACK_EXPORT_ERROR } from "../lib/constants";
import { recursiveCopy } from "../lib/recursive-copy";
import { recursiveDelete } from "../lib/recursive-delete";
import {
  BUILD_ID_FILE,
  CLIENT_PUBLIC_FILES_PATH,
  CLIENT_STATIC_FILES_PATH,
  CONFIG_FILE,
  EXPORT_DETAIL,
  PAGES_MANIFEST,
  PHASE_EXPORT,
  PRERENDER_MANIFEST,
  SERVERLESS_DIRECTORY,
  SERVER_DIRECTORY,
  OUT_DIRECTORY,
} from "../joy-server/lib/constants";
import loadConfig, {
  isTargetLikeServerless,
} from "../joy-server/server/config";
// import { eventCliSession } from '../telemetry/events'
// import { Telemetry } from '../telemetry/storage'
import {
  normalizePagePath,
  denormalizePagePath,
} from "../joy-server/server/normalize-page-path";
import { loadEnvConfig } from "../lib/load-env-config";
import { PrerenderManifest } from "../build/joy-build.service";
import { ExportRenderOpts } from "./worker";
import type exportPage from "./worker";
import { PagesManifest } from "../build/webpack/plugins/pages-manifest-plugin";
import { getPagePath } from "../joy-server/server/require";
import { JoyAppConfig } from "../joy-server/server/joy-config/joy-app-config";
import { Injectable } from "@symph/core";

const exists = promisify(existsOrig);

const createProgress = (total: number, label = "Exporting") => {
  let curProgress = 0;
  let progressSpinner = createSpinner(`${label} (${curProgress}/${total})`, {
    spinner: {
      frames: [
        "[    ]",
        "[=   ]",
        "[==  ]",
        "[=== ]",
        "[ ===]",
        "[  ==]",
        "[   =]",
        "[    ]",
        "[   =]",
        "[  ==]",
        "[ ===]",
        "[====]",
        "[=== ]",
        "[==  ]",
        "[=   ]",
      ],
      interval: 80,
    },
  });

  return () => {
    curProgress++;

    const newText = `${label} (${curProgress}/${total})`;
    if (progressSpinner) {
      progressSpinner.text = newText;
    } else {
      console.log(newText);
    }

    if (curProgress === total && progressSpinner) {
      progressSpinner.stop();
      console.log(newText);
    }
  };
};

type ExportPathMap = {
  [page: string]: { page: string; query?: { [key: string]: string } };
};

interface ExportOptions {
  outdir: string;
  silent?: boolean;
  threads?: number;
  pages?: string[];
  buildExport?: boolean;
  statusMessage?: string;

  initialPageRevalidationMap?: Record<string, any>;
  exportPathMap?: (defaltMap: ExportPathMap) => ExportPathMap;
  trailingSlash?: boolean;
}

@Injectable()
export class JoyExportAppService {
  private distDir: string;

  constructor(private joyAppConfig: JoyAppConfig) {
    this.distDir = joyAppConfig.resolveAppDir(joyAppConfig.distDir);
  }

  async exportApp(dir: string, options: ExportOptions): Promise<void> {
    dir = resolve(dir);

    // attempt to load global env values so they are available in next.config.js
    loadEnvConfig(dir);
    const joyConfig = this.joyAppConfig;
    const { buildExport, trailingSlash } = options;
    const initialPageRevalidationMap = options.initialPageRevalidationMap || {};
    let exportPathMapFn;
    if (buildExport) {
      exportPathMapFn = options.exportPathMap;
      if (typeof exportPathMapFn !== "function") {
        throw new Error(`No "exportPathMap" found in options, during building`);
      }
    } else {
      // Get the exportPathMap from the config file
      if (typeof joyConfig.exportPathMap !== "function") {
        if (!options.silent) {
          Log.info(
            `No "exportPathMap" found in "${CONFIG_FILE}". Generating map from "./pages"`
          );
        }
        exportPathMapFn = async (defaultMap: ExportPathMap) => {
          return defaultMap;
        };
      } else {
        exportPathMapFn = joyConfig.exportPathMap;
      }
    }

    // const threads = options.threads || Math.max(Math.min(cpus().length - 1, 4), 1)
    const threads = 2; // todo remove
    // const distDir = join(dir, joyConfig.distDir)
    const distDir = this.joyAppConfig.resolveAppDir(
      this.distDir,
      OUT_DIRECTORY
    );

    // const telemetry = options.buildExport ? null : new Telemetry({ distDir })
    // if (telemetry) {
    //   telemetry.record(
    //     eventCliSession(PHASE_EXPORT, distDir, {
    //       cliCommand: 'export',
    //       isSrcDir: null,
    //       hasNowJson: !!(await findUp('now.json', { cwd: dir })),
    //       isCustomServer: null,
    //     })
    //   )
    // }

    const subFolders = trailingSlash;
    // const isLikeServerless = joyConfig.target !== 'server'
    const isLikeServerless = false;

    if (!options.silent && !options.buildExport) {
      Log.info(`using build directory: ${distDir}`);
    }

    if (!existsSync(distDir)) {
      throw new Error(
        `Build directory ${distDir} does not exist. Make sure you run "joy build" before running "joy start" or "joy export".`
      );
    }

    const buildId = readFileSync(join(distDir, BUILD_ID_FILE), "utf8");
    const pagesManifest =
      !options.pages &&
      (require(join(
        distDir,
        isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY,
        PAGES_MANIFEST
      )) as PagesManifest);

    let prerenderManifest: PrerenderManifest | undefined = undefined;
    try {
      prerenderManifest = require(join(distDir, PRERENDER_MANIFEST));
    } catch (_) {}

    const excludedPrerenderRoutes = new Set<string>();
    const pages = options.pages || Object.keys(pagesManifest);
    const defaultPathMap: ExportPathMap = {};
    let hasApiRoutes = false;

    for (const page of pages) {
      // _document and _app are not real pages
      // _error is exported as 404.html later on
      // API Routes are Node.js functions

      if (page.match(API_ROUTE)) {
        hasApiRoutes = true;
        continue;
      }

      if (page === "/_document" || page === "/_app" || page === "/_error") {
        continue;
      }

      // iSSG pages that are dynamic should not export templated version by
      // default. In most cases, this would never work. There is no server that
      // could run `getStaticProps`. If users make their page work lazily, they
      // can manually add it to the `exportPathMap`.
      if (prerenderManifest?.dynamicRoutes[page]) {
        excludedPrerenderRoutes.add(page);
        continue;
      }

      defaultPathMap[page] = { page };
    }

    // Initialize the output directory
    const outDir = options.outdir;

    if (outDir === join(dir, "public")) {
      throw new Error(
        `The 'public' directory is reserved in Joy.js and can not be used as the export out directory.`
      );
    }

    await recursiveDelete(join(outDir));
    await promises.mkdir(join(outDir, "_joy", buildId), { recursive: true });

    writeFileSync(
      join(distDir, EXPORT_DETAIL),
      JSON.stringify({
        version: 1,
        outDirectory: outDir,
        success: false,
      }),
      "utf8"
    );

    // Copy static directory
    if (!options.buildExport && existsSync(join(dir, "static"))) {
      if (!options.silent) {
        Log.info('Copying "static" directory');
      }
      await recursiveCopy(join(dir, "static"), join(outDir, "static"));
    }

    // Copy .joy/out/static directory
    if (
      !options.buildExport &&
      existsSync(join(distDir, CLIENT_STATIC_FILES_PATH))
    ) {
      if (!options.silent) {
        Log.info('Copying "static build" directory');
      }
      await recursiveCopy(
        join(distDir, CLIENT_STATIC_FILES_PATH),
        join(outDir, "_joy", CLIENT_STATIC_FILES_PATH)
      );
    }

    // // Get the exportPathMap from the config file
    // if (typeof joyConfig.exportPathMap !== 'function') {
    //   if (!options.silent) {
    //     Log.info(
    //       `No "exportPathMap" found in "${CONFIG_FILE}". Generating map from "./pages"`
    //     )
    //   }
    //   joyConfig.exportPathMap = async (defaultMap: ExportPathMap) => {
    //     return defaultMap
    //   }
    // }

    // Start the rendering process
    const renderOpts = {
      // dir,
      buildId,
      joyExport: true,
      assetPrefix: joyConfig.assetPrefix.replace(/\/$/, ""),
      // distDir,
      dev: false,
      hotReloader: null,
      basePath: joyConfig.basePath,
      canonicalBase: joyConfig.amp?.canonicalBase || "",
      isModern: joyConfig.experimental.modern,
      // ampValidatorPath: joyConfig.experimental.amp?.validator || undefined,
      // ampSkipValidation: joyConfig.experimental.amp?.skipValidation || false,
      // ampOptimizerConfig: joyConfig.experimental.amp?.optimizer || undefined,
      ampValidatorPath: undefined,
      ampSkipValidation: false,
      ampOptimizerConfig: undefined,
    } as ExportRenderOpts;

    const { serverRuntimeConfig, publicRuntimeConfig } = joyConfig;

    if (Object.keys(publicRuntimeConfig).length > 0) {
      renderOpts.runtimeConfig = publicRuntimeConfig;
    }

    // We need this for server rendering the Link component.
    (global as any).__JOY_DATA__ = {
      joyExport: true,
    };

    if (!options.silent && !options.buildExport) {
      Log.info(`Launching ${threads} workers`);
    }
    const exportPathMap = await exportPathMapFn(defaultPathMap, {
      dev: false,
      dir,
      outDir,
      distDir,
      buildId,
    });

    if (!exportPathMap["/404"] && !exportPathMap["/404.html"]) {
      exportPathMap["/404"] = exportPathMap["/404.html"] = {
        page: "/_error",
      };
    }

    // make sure to prevent duplicates
    const exportPaths = [
      ...new Set(
        Object.keys(exportPathMap).map((path) =>
          denormalizePagePath(normalizePagePath(path))
        )
      ),
    ];

    const filteredPaths = exportPaths.filter(
      // Remove API routes
      (route) => !exportPathMap[route].page.match(API_ROUTE)
    );

    if (filteredPaths.length !== exportPaths.length) {
      hasApiRoutes = true;
    }

    if (prerenderManifest && !options.buildExport) {
      const fallbackEnabledPages = new Set();

      for (const key of Object.keys(prerenderManifest.dynamicRoutes)) {
        // only error if page is included in path map
        if (!exportPathMap[key] && !excludedPrerenderRoutes.has(key)) {
          continue;
        }

        if (prerenderManifest.dynamicRoutes[key].fallback !== false) {
          fallbackEnabledPages.add(key);
        }
      }

      if (fallbackEnabledPages.size) {
        console.warn(
          `Found pages with \`fallback\` enabled:\n${[
            ...fallbackEnabledPages,
          ].join("\n")}\n${SSG_FALLBACK_EXPORT_ERROR}\n`
        );
        // throw new Error(
        //   `Found pages with \`fallback\` enabled:\n${[
        //     ...fallbackEnabledPages,
        //   ].join('\n')}\n${SSG_FALLBACK_EXPORT_ERROR}\n`
        // )
      }
    }

    // Warn if the user defines a path for an API page
    if (hasApiRoutes) {
      if (!options.silent) {
        Log.warn(
          chalk.yellow(
            `Statically exporting a Joy.js application via \`joy export\` disables API routes.`
          ) +
            `\n` +
            chalk.yellow(
              `This command is meant for static-only hosts, and is` +
                " " +
                chalk.bold(`not necessary to make your application static.`)
            ) +
            `\n` +
            chalk.yellow(
              `Pages in your application without server-side data dependencies will be automatically statically exported by \`joy build\`, including pages powered by \`getStaticProps\`.`
            )
        );
      }
    }

    const progress =
      !options.silent &&
      createProgress(
        filteredPaths.length,
        `${Log.prefixes.info} ${options.statusMessage}`
      );
    const pagesDataDir = options.buildExport
      ? outDir
      : join(outDir, "_joy/data", buildId);

    const ampValidations: AmpPageStatus = {};
    let hadValidationError = false;

    const publicDir = join(dir, CLIENT_PUBLIC_FILES_PATH);
    // Copy public directory
    if (!options.buildExport && existsSync(publicDir)) {
      if (!options.silent) {
        Log.info('Copying "public" directory');
      }
      await recursiveCopy(publicDir, outDir, {
        filter(path) {
          // Exclude paths used by pages
          return !exportPathMap[path];
        },
      });
    }

    const worker = new Worker(require.resolve("./worker"), {
      maxRetries: 0,
      numWorkers: threads,
      enableWorkerThreads: joyConfig.experimental.workerThreads,
      exposedMethods: ["default"],
    }) as Worker & { default: typeof exportPage };

    worker.getStdout().pipe(process.stdout);
    worker.getStderr().pipe(process.stderr);

    let renderError = false;
    const errorPaths: string[] = [];
    await Promise.all(
      filteredPaths.map(async (path) => {
        // ['/dynamic/1'].map(async (path) => {
        const result = await worker.default({
          dir,
          path,
          pathMap: exportPathMap[path],
          distDir,
          outDir,
          pagesDataDir,
          renderOpts,
          serverRuntimeConfig: serverRuntimeConfig as any,
          subFolders: subFolders as any,
          buildExport: options.buildExport,
          serverless: isTargetLikeServerless(joyConfig.target),
          optimizeFonts: joyConfig.experimental.optimizeFonts,
          optimizeImages: joyConfig.experimental.optimizeImages,
        });

        for (const validation of result.ampValidations || []) {
          const { page, result: ampValidationResult } = validation;
          ampValidations[page] = ampValidationResult;
          hadValidationError =
            hadValidationError ||
            (Array.isArray(ampValidationResult?.errors) &&
              ampValidationResult.errors.length > 0);
        }
        renderError = renderError || !!result.error;
        if (!!result.error) errorPaths.push(path);

        if (
          options.buildExport &&
          typeof result.fromBuildExportRevalidate !== "undefined"
        ) {
          initialPageRevalidationMap[path] = result.fromBuildExportRevalidate;
        }
        if (progress) progress();
      })
    );

    worker.end();

    // copy prerendered routes to outDir
    if (!options.buildExport && prerenderManifest) {
      await Promise.all(
        Object.keys(prerenderManifest.routes).map(async (route) => {
          const { srcRoute } = prerenderManifest!.routes[route];
          const pageName = srcRoute || route;
          // const pagePath = getPagePath(pageName, distDir, isLikeServerless)
          const pagePath = getPagePath(pageName, distDir);
          const distPagesDir = join(
            pagePath,
            // strip leading / and then recurse number of nested dirs
            // to place from base folder
            pageName
              .substr(1)
              .split("/")
              .map(() => "..")
              .join("/")
          );
          route = normalizePagePath(route);

          const orig = join(distPagesDir, route);
          const htmlDest = join(
            outDir,
            `${route}${
              subFolders && route !== "/index" ? `${sep}index` : ""
            }.html`
          );
          const ampHtmlDest = join(
            outDir,
            `${route}.amp${subFolders ? `${sep}index` : ""}.html`
          );
          const jsonDest = join(pagesDataDir, `${route}.json`);

          await promises.mkdir(dirname(htmlDest), { recursive: true });
          await promises.mkdir(dirname(jsonDest), { recursive: true });
          await promises.copyFile(`${orig}.html`, htmlDest);
          await promises.copyFile(`${orig}.json`, jsonDest);

          if (await exists(`${orig}.amp.html`)) {
            await promises.mkdir(dirname(ampHtmlDest), { recursive: true });
            await promises.copyFile(`${orig}.amp.html`, ampHtmlDest);
          }
        })
      );
    }

    if (Object.keys(ampValidations).length) {
      console.log(formatAmpMessages(ampValidations));
    }
    if (hadValidationError) {
      throw new Error(`AMP Validation caused the export to fail.`);
    }

    if (renderError) {
      throw new Error(
        `Export encountered errors on following paths:\n\t${errorPaths
          .sort()
          .join("\n\t")}`
      );
    }

    writeFileSync(
      join(distDir, EXPORT_DETAIL),
      JSON.stringify({
        version: 1,
        outDirectory: outDir,
        success: true,
      }),
      "utf8"
    );

    // if (telemetry) {
    //   await telemetry.flush()
    // }
  }
}
