import { dirname, extname, join, sep } from "path";
import { Render } from "../joy-server/server/render";
import { promises } from "fs";
import AmpHtmlValidator from "amphtml-validator";
import { loadComponents, LoadComponentsReturnType } from "../joy-server/server/load-components";
import { isDynamicRoute } from "../joy-server/lib/router/utils/is-dynamic";
import { getRouteMatcher } from "../joy-server/lib/router/utils/route-matcher";
import { getRouteRegex } from "../joy-server/lib/router/utils/route-regex";
import { normalizePagePath } from "../joy-server/server/normalize-page-path";
import "../joy-server/server/node-polyfill-fetch";
import { IncomingMessage, ServerResponse } from "http";
import { ComponentType } from "react";
import { GetStaticProps } from "../types";
import { requireFontManifest } from "../joy-server/server/require";
import { FontManifest } from "../joy-server/server/font-utils";
import { Configuration, ApplicationContext, ValueComponent } from "@symph/core";
import { ReactContextFactory } from "../react/react-context-factory";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { EnumReactAppInitStage } from "@symph/react/dist/react-app-init-stage.enum";
import { ConfigService, CONFIG_INIT_VALUE } from "@symph/config";
import { JoyConfigConfiguration } from "../joy-server/server/joy-config.configuration";
import { ReactRouterService } from "@symph/react";

const envConfig = require("../joy-server/lib/runtime-config");

(global as any).__JOY_DATA__ = {
  joyExport: true,
};

interface AmpValidation {
  page: string;
  result: {
    errors: AmpHtmlValidator.ValidationError[];
    warnings: AmpHtmlValidator.ValidationError[];
  };
}

interface PathMap {
  page: string;
  query?: { [key: string]: string | string[] };
}

interface ExportPageInput {
  port: number;

  dir: string;
  path: string;
  pathMap: PathMap;
  distDir: string;
  outDir: string;
  pagesDataDir: string;
  renderOpts: ExportRenderOpts;
  buildExport?: boolean;
  prerenderOut?: { html: string; data: string };
  serverRuntimeConfig: string;
  subFolders: string;
  serverless: boolean;
  optimizeFonts: boolean;
  optimizeImages: boolean;
}

interface ExportPageResults {
  ampValidations: AmpValidation[];
  fromBuildExportRevalidate?: number;
  error?: boolean;
}

export interface ExportRenderOpts {
  buildId: string;
  basePath: string;
  canonicalBase: string;
  runtimeConfig?: { [key: string]: any };
  params?: { [key: string]: string | string[] };
  ampPath?: string;
  ampValidatorPath?: string;
  ampSkipValidation?: boolean;
  hybridAmp?: boolean;
  inAmpMode?: boolean;
  optimizeFonts?: boolean;
  optimizeImages?: boolean;
  fontManifest?: FontManifest;
}

@Configuration()
export class JoyExportConfig {
  @Configuration.Component()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Component()
  public joyAppConfig: JoyAppConfig;

  @Configuration.Component()
  public reactContextFactory: ReactContextFactory;
}

export default async function start(options: ExportPageInput): Promise<ExportPageResults> {
  const { dir, port } = options;
  const joyContext = new ApplicationContext([
    JoyExportConfig,
    {
      initValue: {
        name: CONFIG_INIT_VALUE,
        useValue: {
          port,
          dir,
          dev: false,
        },
      } as ValueComponent,
    },
  ]);
  await joyContext.init();
  const configService = await joyContext.get(ConfigService);
  return exportPage(joyContext, options);
}

export async function exportPage(
  joyContext: ApplicationContext,
  {
    dir,
    path,
    pathMap,
    distDir,
    outDir,
    pagesDataDir,
    renderOpts,
    buildExport,
    prerenderOut,
    serverRuntimeConfig,
    subFolders,
    serverless,
    optimizeFonts,
    optimizeImages,
  }: ExportPageInput
): Promise<ExportPageResults> {
  // eslint-disable-next-line prefer-rest-params
  let results: ExportPageResults = {
    ampValidations: [],
  };

  try {
    const { query: originalQuery = {} } = pathMap;
    const { page } = pathMap;
    const filePath = normalizePagePath(path);
    const ampPath = `${filePath}.amp`;
    let query = { ...originalQuery };
    let params: { [key: string]: string | string[] } | undefined;

    // We need to show a warning if they try to provide query values
    // for an auto-exported page since they won't be available
    const hasOrigQueryValues = Object.keys(originalQuery).length > 0;
    const queryWithAutoExportWarn = () => {
      if (hasOrigQueryValues) {
        throw new Error(
          `\nError: you provided query values for ${path} which is an auto-exported page. These can not be applied since the page can no longer be re-rendered on the server. To disable auto-export for this page add \`getInitialProps\`\n`
        );
      }
    };

    // Check if the page is a specified dynamic route
    if (isDynamicRoute(page) && page !== path) {
      params = getRouteMatcher(getRouteRegex(page))(path) || undefined;
      if (params) {
        // we have to pass these separately for serverless
        if (!serverless) {
          query = {
            ...query,
            ...params,
          };
        }
      } else {
        throw new Error(`The provided export path '${path}' doesn't match the '${page}' page.`);
      }
    }

    const headerMocks = {
      headers: {},
      getHeader: () => ({}),
      setHeader: () => {},
      hasHeader: () => false,
      removeHeader: () => {},
      getHeaderNames: () => [],
    };

    const req = {
      url: path,
      ...headerMocks,
    } as unknown as IncomingMessage;
    const res = {
      ...headerMocks,
    } as unknown as ServerResponse;

    envConfig.setConfig({
      serverRuntimeConfig,
      publicRuntimeConfig: renderOpts.runtimeConfig,
    });

    let htmlFilename = `${filePath}${sep}index.html`;
    if (!subFolders) htmlFilename = `${filePath}.html`;

    const pageExt = extname(page);
    const pathExt = extname(path);
    // Make sure page isn't a folder with a dot in the name e.g. `v1.2`
    if (pageExt !== pathExt && pathExt !== "") {
      // If the path has an extension, use that as the filename instead
      htmlFilename = path;
    } else if (path === "/") {
      // If the path is the root, just use index.html
      htmlFilename = "index.html";
    }

    const baseDir = join(outDir, dirname(htmlFilename));
    let htmlFilepath = join(outDir, htmlFilename);

    await promises.mkdir(baseDir, { recursive: true });

    let render = new Render();

    const hasRenderedDuringBuild = () => {
      // return !buildExport && !isDynamicRoute(path);
      return !buildExport && prerenderOut?.html;
    };

    // if (serverless) {
    //   // const curUrl = url.parse(req.url!, true)
    //   // req.url = url.format({
    //   //   ...curUrl,
    //   //   query: {
    //   //     ...curUrl.query,
    //   //     ...query,
    //   //   },
    //   // })
    //   // const { Component: mod, getServerSideProps } = await loadComponents(
    //   //   distDir,
    //   //   page,
    //   //   serverless
    //   // )
    //   //
    //   // if (getServerSideProps) {
    //   //   throw new Error(`Error for page ${page}: ${SERVER_PROPS_EXPORT_ERROR}`)
    //   // }
    //   //
    //   // // if it was auto-exported the HTML is loaded here
    //   // if (typeof mod === 'string') {
    //   //   html = mod
    //   //   queryWithAutoExportWarn()
    //   // } else {
    //   //   // for non-dynamic SSG pages we should have already
    //   //   // prerendered the file
    //   //   if (hasRenderedDuringBuild((mod as ComponentModule).getStaticProps))
    //   //     return results
    //   //
    //   //   if (
    //   //     (mod as ComponentModule).getStaticProps &&
    //   //     !htmlFilepath.endsWith('.html')
    //   //   ) {
    //   //     // make sure it ends with .html if the name contains a dot
    //   //     htmlFilename += '.html'
    //   //     htmlFilepath += '.html'
    //   //   }
    //   //
    //   //   renderMethod = (mod as ComponentModule).renderReqToHTML
    //   //   const result = await renderMethod(
    //   //     req,
    //   //     res,
    //   //     'export',
    //   //     {
    //   //       ampPath,
    //   //       /// @ts-ignore
    //   //       optimizeFonts,
    //   //       /// @ts-ignore
    //   //       optimizeImages,
    //   //       fontManifest: optimizeFonts
    //   //         ? requireFontManifest(distDir, serverless)
    //   //         : null,
    //   //     },
    //   //     // @ts-ignore
    //   //     params
    //   //   )
    //   //   curRenderOpts = result.renderOpts || {}
    //   //   html = result.html
    //   // }
    //   //
    //   // if (!html) {
    //   //   throw new Error(`Failed to render serverless page`)
    //   // }
    // } else {
    let components: LoadComponentsReturnType;
    if (["/_error", "/404"].includes(path)) {
      if ("/404" === path) {
        res.statusCode = 404;
      }
      components = await loadComponents(distDir, "/_error", serverless);
    } else {
      components = await loadComponents(distDir, "/_app", serverless);
    }

    // for non-dynamic SSG pages we should have already
    // prerendered the file
    if (hasRenderedDuringBuild()) {
      return results;
    }

    // // TODO: de-dupe the logic here between serverless and server mode
    // if (!htmlFilepath.endsWith('.html')) {
    //   // make sure it ends with .html if the name contains a dot
    //   htmlFilepath += '.html'
    //   htmlFilename += '.html'
    // }

    // if (typeof components.Component === 'string') {
    //   html = components.Component
    //   queryWithAutoExportWarn()
    // } else {
    /**
     * This sets environment variable to be used at the time of static export by head.tsx.
     * Using this from process.env allows targetting both serverless and SSR by calling
     * `process.env.__JOY_OPTIMIZE_FONTS`.
     * TODO(prateekbh@): Remove this when experimental.optimizeFonts are being clened up.
     */
    if (optimizeFonts) {
      process.env.__JOY_OPTIMIZE_FONTS = JSON.stringify(true);
    }
    if (optimizeImages) {
      process.env.__JOY_OPTIMIZE_IMAGES = JSON.stringify(true);
    }

    const reactContextFactory = await joyContext.get(ReactContextFactory);
    const reactApplicationContext = await reactContextFactory.getReactAppContext(req, res, path, query);
    const routeService = reactApplicationContext.getSync(ReactRouterService);
    const matchedRoutes = routeService.matchRoutes(path);

    const curRenderOpts = {
      initStage: EnumReactAppInitStage.STATIC,
      ...components,
      ...renderOpts,
      ampPath,
      params,
      optimizeFonts,
      optimizeImages,
      fontManifest: optimizeFonts ? requireFontManifest(distDir, serverless) : null,
      reactApplicationContext,
      matchedRoutes,
    };
    const html = (await render.renderToHTML(req, res, page, query, curRenderOpts)) as string;
    // }
    // }

    // const validateAmp = async (
    //   rawAmpHtml: string,
    //   ampPageName: string,
    //   validatorPath?: string
    // ) => {
    //   const validator = await AmpHtmlValidator.getInstance(validatorPath)
    //   const result = validator.validateString(rawAmpHtml)
    //   const errors = result.errors.filter((e: ValidateError) => e.severity === 'ERROR')
    //   const warnings = result.errors.filter((e: ValidateError) => e.severity !== 'ERROR')
    //
    //   if (warnings.length || errors.length) {
    //     results.ampValidations.push({
    //       page: ampPageName,
    //       result: {
    //         errors,
    //         warnings,
    //       },
    //     })
    //   }
    // }

    // if (curRenderOpts.inAmpMode && !curRenderOpts.ampSkipValidation) {
    //   await validateAmp(html, path, curRenderOpts.ampValidatorPath)
    // } else if (curRenderOpts.hybridAmp) {
    //   // we need to render the AMP version
    //   let ampHtmlFilename = `${ampPath}${sep}index.html`
    //   if (!subFolders) {
    //     ampHtmlFilename = `${ampPath}.html`
    //   }
    //   const ampBaseDir = join(outDir, dirname(ampHtmlFilename))
    //   const ampHtmlFilepath = join(outDir, ampHtmlFilename)
    //
    //   try {
    //     await promises.access(ampHtmlFilepath)
    //   } catch (_) {
    //     // make sure it doesn't exist from manual mapping
    //     let ampHtml
    //     if (serverless) {
    //       req.url += (req.url!.includes('?') ? '&' : '?') + 'amp=1'
    //       // @ts-ignore
    //       ampHtml = (await renderMethod(req, res, 'export')).html
    //     } else {
    //       ampHtml = await renderMethod(
    //         req,
    //         res,
    //         page,
    //         // @ts-ignore
    //         { ...query, amp: 1 },
    //         curRenderOpts
    //       )
    //     }
    //
    //     if (!curRenderOpts.ampSkipValidation) {
    //       await validateAmp(ampHtml, page + '?amp=1')
    //     }
    //     await promises.mkdir(ampBaseDir, { recursive: true })
    //     await promises.writeFile(ampHtmlFilepath, ampHtml, 'utf8')
    //   }
    // }

    if ((curRenderOpts as any).routesSSGData) {
      const dataFile = join(pagesDataDir, htmlFilename.replace(/\.html$/, ".json"));

      await promises.mkdir(dirname(dataFile), { recursive: true });
      await promises.writeFile(dataFile, JSON.stringify((curRenderOpts as any).routesSSGData), "utf8");

      if (curRenderOpts.hybridAmp) {
        await promises.writeFile(dataFile.replace(/\.json$/, ".amp.json"), JSON.stringify((curRenderOpts as any).routesSSGData), "utf8");
      }
    }
    results.fromBuildExportRevalidate = (curRenderOpts as any).revalidate;
    await promises.writeFile(htmlFilepath, html, "utf8");
    return results;
  } catch (error) {
    console.error(`\nError occurred prerendering page "${path}". \n` + error.stack);
    return { ...results, error: true };
  }
}
