import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { isInAmpMode } from "../lib/amp";
import { AmpStateContext } from "../lib/amp-context";
import { AMP_RENDER_TARGET } from "../lib/constants";
import { defaultHead } from "../lib/head";
import { HeadManagerContext } from "../lib/head-manager-context";
import Loadable from "../lib/loadable";
import { LoadableContext } from "../lib/loadable-context";
import mitt, { MittEmitter } from "../lib/mitt";
import postProcess from "../lib/post-process";
import { JoyRouter } from "../lib/router/router";
import { isDynamicRoute } from "../lib/router/utils/is-dynamic";
import {
  AppType,
  ComponentsEnhancer,
  DocumentInitialProps,
  DocumentProps,
  DocumentType,
  getDisplayName,
  isResSent,
  JoyComponentType,
  loadGetInitialProps,
  RenderPage,
} from "../lib/utils";
import { __ApiPreviewProps } from "./api-utils";
import { denormalizePagePath } from "./denormalize-page-path";
import { FontManifest, getFontDefinitionFromManifest } from "./font-utils";
import { LoadComponentsReturnType, ManifestItem } from "./load-components";
import { normalizePagePath } from "./normalize-page-path";
import optimizeAmp from "./optimize-amp";
import { JoyRouteInitState, ReactAppContainer, ReactAppInitManager, ReactApplicationContext } from "@symph/react";
import { ReactReduxService } from "@symph/react/dist/redux/react-redux.service";
import { EnumReactAppInitStage } from "@symph/react/dist/react-app-init-stage.enum";

function noRouter() {
  const message =
    'No router instance found. you should only use "next/router" inside the client side of your app. https://err.sh/vercel/next.js/no-router-instance';
  throw new Error(message);
}

class ServerRouter implements JoyRouter {
  route: string;
  pathname: string;
  query: ParsedUrlQuery;
  asPath: string;
  basePath: string;
  events: any;
  isFallback: boolean;
  // TODO: Remove in the next major version, as this would mean the user is adding event listeners in server-side `render` method
  static events: MittEmitter = mitt();

  constructor(pathname: string, query: ParsedUrlQuery, as: string, { isFallback }: { isFallback: boolean }, basePath: string) {
    this.route = pathname.replace(/\/$/, "") || "/";
    this.pathname = pathname;
    this.query = query;
    this.asPath = as;
    this.isFallback = isFallback;
    this.basePath = basePath;
  }

  push(): any {
    noRouter();
  }

  replace(): any {
    noRouter();
  }

  reload() {
    noRouter();
  }

  back() {
    noRouter();
  }

  prefetch(): any {
    noRouter();
  }

  beforePopState() {
    noRouter();
  }
}

function enhanceComponents(
  options: ComponentsEnhancer,
  App: AppType,
  Component: JoyComponentType
): {
  App: AppType;
  Component: JoyComponentType;
} {
  // For backwards compatibility
  if (typeof options === "function") {
    return {
      App,
      Component: options(Component),
    };
  }

  return {
    App: options.enhanceApp ? options.enhanceApp(App) : App,
    Component: options.enhanceComponent ? options.enhanceComponent(Component) : Component,
  };
}

export type RenderOptsPartial = {
  initStage: EnumReactAppInitStage;
  buildId: string;
  canonicalBase: string;
  runtimeConfig?: { [key: string]: any };
  assetPrefix?: string;
  apiPrefix?: string;
  err?: Error | null;
  autoExport?: boolean;
  joyExport?: boolean;
  dev?: boolean;
  ampMode?: any;
  ampPath?: string;
  inAmpMode?: boolean;
  hybridAmp?: boolean;
  ErrorComponent?: React.ComponentType<{ error: Error }>;
  ampValidator?: (html: string, pathname: string) => Promise<void>;
  ampSkipValidation?: boolean;
  ampOptimizerConfig?: { [key: string]: any };
  isDataReq?: boolean;
  params?: ParsedUrlQuery;
  previewProps?: __ApiPreviewProps;
  basePath: string;
  unstable_runtimeJS?: false;
  optimizeFonts: boolean;
  fontManifest?: FontManifest;
  optimizeImages: boolean;
  devOnlyCacheBusterQueryString?: string;

  reactApplicationContext?: ReactApplicationContext;
  ssr?: boolean;
};

export type RenderOpts = LoadComponentsReturnType & RenderOptsPartial;

function renderDocument(
  Document: DocumentType,
  {
    buildManifest,
    docComponentsRendered,
    initState,
    props,
    docProps,
    pathname,
    query,
    buildId,
    canonicalBase,
    assetPrefix,
    apiPrefix,
    runtimeConfig,
    joyExport,
    autoExport,
    isFallback,
    dynamicImportsIds,
    dangerousAsPath,
    err,
    dev,
    ampPath,
    ampState,
    inAmpMode,
    hybridAmp,
    dynamicImports,
    headTags,
    // gsp,
    // gssp,
    ssr,
    customServer,
    gip,
    appGip,
    unstable_runtimeJS,
    devOnlyCacheBusterQueryString,
  }: RenderOpts & {
    initState: any;
    props: any;
    docComponentsRendered: DocumentProps["docComponentsRendered"];
    docProps: DocumentInitialProps;
    pathname: string;
    query: ParsedUrlQuery;
    dangerousAsPath: string;
    ampState: any;
    ampPath: string;
    inAmpMode: boolean;
    hybridAmp: boolean;
    dynamicImportsIds: string[];
    dynamicImports: ManifestItem[];
    headTags: any;
    isFallback?: boolean;
    // gsp?: boolean;
    // gssp?: boolean;
    ssr?: boolean;
    customServer?: boolean;
    gip?: boolean;
    appGip?: boolean;
    devOnlyCacheBusterQueryString: string;
  }
): string {
  return (
    "<!DOCTYPE html>" +
    renderToStaticMarkup(
      <AmpStateContext.Provider value={ampState}>
        {Document.renderDocument(Document, {
          __JOY_DATA__: {
            initState,
            props, // The result of getInitialProps
            page: pathname, // The rendered page
            query, // querystring parsed / passed by the user
            buildId, // buildId is used to facilitate caching of page bundles, we send it to the client so that pageloader knows where to load bundles
            assetPrefix: assetPrefix === "" ? undefined : assetPrefix, // send assetPrefix to the client side when configured, otherwise don't sent in the resulting HTML
            apiPrefix: apiPrefix === "" ? undefined : apiPrefix, // send apiPrefix to the client side when configured, otherwise don't sent in the resulting HTML
            runtimeConfig, // runtimeConfig if provided, otherwise don't sent in the resulting HTML
            joyExport, // If this is a page exported by `joy export`
            autoExport, // If this is an auto exported page
            isFallback,
            dynamicIds: dynamicImportsIds.length === 0 ? undefined : dynamicImportsIds,
            err: err ? serializeError(dev, err) : undefined, // Error if one happened, otherwise don't sent in the resulting HTML
            // gsp, // whether the page is getStaticProps
            // gssp, // whether the page is getServerSideProps
            ssr,
            customServer, // whether the user is using a custom server
            gip, // whether the page has getInitialProps
            appGip, // whether the _app has getInitialProps
          },
          buildManifest,
          docComponentsRendered,
          dangerousAsPath,
          canonicalBase,
          ampPath,
          inAmpMode,
          isDevelopment: !!dev,
          hybridAmp,
          dynamicImports,
          assetPrefix,
          headTags,
          unstable_runtimeJS,
          devOnlyCacheBusterQueryString,
          ...docProps,
        })}
      </AmpStateContext.Provider>
    )
  );
}

const invalidKeysMsg = (methodName: string, invalidKeys: string[]) => {
  return (
    `Additional keys were returned from \`${methodName}\`. Properties intended for your component must be nested under the \`props\` key, e.g.:` +
    `\n\n\treturn { props: { title: 'My Title', content: '...' } }` +
    `\n\nKeys that need to be moved: ${invalidKeys.join(", ")}.` +
    `\nRead more: https://err.sh/next.js/invalid-getstaticprops-value`
  );
};

export async function renderToHTML(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  query: ParsedUrlQuery,
  renderOpts: RenderOpts
): Promise<string | null> {
  // In dev we invalidate the cache by appending a timestamp to the resource URL.
  // TODO: remove this workaround when https://bugs.webkit.org/show_bug.cgi?id=187726 is fixed.
  renderOpts.devOnlyCacheBusterQueryString = renderOpts.dev ? renderOpts.devOnlyCacheBusterQueryString || `?ts=${Date.now()}` : "";

  const {
    err,
    dev = false,
    ampPath = "",
    App,
    Document,
    pageConfig = {},
    // Component,
    buildManifest,
    fontManifest,
    reactLoadableManifest,
    ErrorComponent,
    // getStaticProps,
    // getStaticPaths,
    // getServerSideProps,
    isDataReq,
    params,
    previewProps,
    basePath,
    devOnlyCacheBusterQueryString,

    reactApplicationContext,
    initStage,
    ssr = true,
  } = renderOpts;

  const getFontDefinition = (url: string): string => {
    if (fontManifest) {
      return getFontDefinitionFromManifest(url, fontManifest);
    }
    return "";
  };

  const callMiddleware = async (method: string, args: any[], props = false) => {
    let results: any = props ? {} : [];

    if ((Document as any)[`${method}Middleware`]) {
      let middlewareFunc = await (Document as any)[`${method}Middleware`];
      middlewareFunc = middlewareFunc.default || middlewareFunc;

      const curResults = await middlewareFunc(...args);
      if (props) {
        for (const result of curResults) {
          results = {
            ...results,
            ...result,
          };
        }
      } else {
        results = curResults;
      }
    }
    return results;
  };

  const headTags = (...args: any) => callMiddleware("headTags", args);

  const isFallback = !!query.__joyFallback;
  delete query.__joyFallback;

  const isSSR = ssr;
  const isSSG = true;
  // const isSSG = !!getStaticProps
  // const isBuildTimeSSG = isSSG && renderOpts.joyExport
  const defaultAppGetInitialProps = App.getInitialProps === (App as any).origGetInitialProps;

  // todo 在controller装饰器中，校验controller类的合法性
  // const hasPageGetInitialProps = !!(Component as any).getInitialProps

  const pageIsDynamic = isDynamicRoute(pathname);
  const isAutoExport = false; // todo 开启自动导出功能，例如在路由组件中没有数据获取的纯静态路由

  if (dev) {
    const { isValidElementType } = require("react-is");

    if (!isValidElementType(App)) {
      throw new Error(`The default export is not a React Component in page: "/_app"`);
    }

    if (!isValidElementType(Document)) {
      throw new Error(`The default export is not a React Component in page: "/_document"`);
    }

    if (isAutoExport || isFallback) {
      // remove query values except ones that will be set during export
      query = {
        ...(query.amp
          ? {
              amp: query.amp,
            }
          : {}),
      };
      req.url = pathname;
      renderOpts.joyExport = true;
    }
    // 404 可以获取数据，所以不需要下面的判断
    // if (pathname === '/404' && (hasPageGetInitialProps || getServerSideProps)) {
    //   throw new Error(PAGES_404_GET_INITIAL_PROPS_ERROR)
    // }
  }
  if (isAutoExport) renderOpts.autoExport = true;
  if (isSSG) renderOpts.joyExport = false;

  await Loadable.preloadAll(); // Make sure all dynamic imports are loaded

  // url will always be set
  const asPath: string = req.url as string;
  const router = new ServerRouter(
    pathname,
    query,
    asPath,
    {
      isFallback: isFallback,
    },
    basePath
  );

  const ctx = {
    reactApplicationContext,
    err,
    req: isAutoExport ? undefined : req,
    res: isAutoExport ? undefined : res,
    pathname,
    query,
    asPath,
    AppTree: (props: any) => {
      // return (
      //   <AppContainer App={App}>
      //     <App {...props} Component={Component} router={router} />
      //   </AppContainer>
      // )
      return <AppContainer />;
    },
  };
  const props: any = {};

  const ampState = {
    ampFirst: pageConfig.amp === true,
    hasQuery: Boolean(query.amp),
    hybrid: pageConfig.amp === "hybrid",
  };

  const inAmpMode = isInAmpMode(ampState);

  const reactLoadableModules: string[] = [];

  let head: JSX.Element[] = defaultHead(inAmpMode);

  // const AppContainer = ({ children }: any) => (
  //   <RouterContext.Provider value={router}>
  //
  //   </RouterContext.Provider>
  // )

  const ExtendAppComp = (props: any) => (
    <AmpStateContext.Provider value={ampState}>
      <HeadManagerContext.Provider
        value={{
          updateHead: (state) => {
            head = state;
          },
          mountedInstances: new Set(),
        }}
      >
        <LoadableContext.Provider value={(moduleName) => reactLoadableModules.push(moduleName)}>
          <App {...props} />
        </LoadableContext.Provider>
      </HeadManagerContext.Provider>
    </AmpStateContext.Provider>
  );

  let AppContainer = () => {
    return <ReactAppContainer appContext={reactApplicationContext!} Component={ExtendAppComp} />;
  };

  // We only need to do this if we want to support calling
  // _app's getInitialProps for getServerSideProps if not this can be removed
  if (isDataReq && !isSSG) return props;

  // We don't call getStaticProps or getServerSideProps while generating
  // the fallback so make sure to set pageProps to an empty object
  if (isFallback) {
    props.pageProps = {};
  }

  // the response might be finished on the getInitialProps call
  if (isResSent(res) && !isSSG) return null;

  // we preload the buildManifest for auto-export dynamic pages
  // to speed up hydrating query values
  let filteredBuildManifest = buildManifest;
  if (isAutoExport && pageIsDynamic) {
    const page = denormalizePagePath(normalizePagePath(pathname));
    // This code would be much cleaner using `immer` and directly pushing into
    // the result from `getPageFiles`, we could maybe consider that in the
    // future.
    if (page in filteredBuildManifest.pages) {
      filteredBuildManifest = {
        ...filteredBuildManifest,
        pages: {
          ...filteredBuildManifest.pages,
          [page]: [...filteredBuildManifest.pages[page], ...filteredBuildManifest.lowPriorityFiles.filter((f) => f.includes("_buildManifest"))],
        },
        lowPriorityFiles: filteredBuildManifest.lowPriorityFiles.filter((f) => !f.includes("_buildManifest")),
      };
    }
  }

  const renderData = async () => {
    if (ctx.err) {
      return {};
    }
    if (!reactApplicationContext) {
      throw new Error("init controller data error, react application context is undefined.");
    }

    const initManager = await reactApplicationContext.get(ReactAppInitManager);
    const reduxService = await reactApplicationContext.get(ReactReduxService);
    initManager.resetInitState(pathname);
    initManager.initStage = initStage;
    reduxService.startRecordState();
    /**
     * 执行一次页面渲染，触发页面的initialStaticModelState()方法，获取页面的数据，然后用数据在重新绘制一次页面
     * 相当于一次页面请求，服务端需要执行两次 React 渲染
     */
    renderToStaticMarkup(<AppContainer />);
    let revalidate: number | undefined;
    try {
      const initRst = await initManager.waitAllFinished(pathname);
      revalidate = initRst.revalidate;
      let { initStatic, init } = initManager.getPathState(pathname);
      if (initStage >= EnumReactAppInitStage.STATIC && (initStatic === JoyRouteInitState.NONE || initStatic === JoyRouteInitState.LOADING)) {
        initStatic = JoyRouteInitState.SUCCESS;
      }
      if ((initStage >= EnumReactAppInitStage.DYNAMIC && init === JoyRouteInitState.NONE) || init === JoyRouteInitState.LOADING) {
        init = JoyRouteInitState.SUCCESS;
      }
      initManager.setInitState(pathname, { initStatic, init });
    } catch (e) {
      initManager.setInitState(pathname, { initStatic: JoyRouteInitState.ERROR });
    }

    const reduxStateHistories = reduxService.stopRecordState();
    (renderOpts as any).pageData = reduxStateHistories;
    (renderOpts as any).revalidate = revalidate;
    return {
      revalidate,
      stateHistories: reduxStateHistories,
    };
  };
  if (isSSR) {
    await renderData();
  }

  const renderPage: RenderPage = (options: ComponentsEnhancer = {}): { html: string; head: any } => {
    if (!isSSR) {
      return { html: "", head };
    }
    if (ctx.err && ErrorComponent) {
      return { html: renderToString(<ErrorComponent error={ctx.err} />), head };
    }

    // if (dev && (props.router || props.Component)) {
    //   throw new Error(
    //     `'router' and 'Component' can not be returned in getInitialProps from _app.js https://err.sh/vercel/next.js/cant-override-next-props`
    //   );
    // }

    // const {
    //   App: EnhancedApp,
    //   Component: EnhancedComponent,
    // } = enhanceComponents(options, App, Component)

    const html = renderToString(<AppContainer />);

    return { html, head };
  };
  const documentCtx = { ...ctx, renderPage };
  const docProps: DocumentInitialProps = await loadGetInitialProps(Document, documentCtx);
  // the response might be finished on the getInitialProps call
  if (isResSent(res) && !isSSG) return null;

  if (!docProps || typeof docProps.html !== "string") {
    const message = `"${getDisplayName(Document)}.getInitialProps()" should resolve to an object with a "html" prop set with a valid html string`;
    throw new Error(message);
  }

  const dynamicImportIdsSet = new Set<string>();
  const dynamicImports: ManifestItem[] = [];

  for (const mod of reactLoadableModules) {
    const manifestItem: ManifestItem[] = reactLoadableManifest[mod];

    if (manifestItem) {
      manifestItem.forEach((item) => {
        dynamicImports.push(item);
        dynamicImportIdsSet.add(item.id as string);
      });
    }
  }

  const dynamicImportsIds = [...dynamicImportIdsSet];
  const hybridAmp = ampState.hybrid;

  // update renderOpts so export knows current state
  renderOpts.inAmpMode = inAmpMode;
  renderOpts.hybridAmp = hybridAmp;

  const docComponentsRendered: DocumentProps["docComponentsRendered"] = {};

  let html = renderDocument(Document, {
    ...renderOpts,
    docComponentsRendered,
    buildManifest: filteredBuildManifest,
    // Only enabled in production as development mode has features relying on HMR (style injection for example)
    unstable_runtimeJS: process.env.NODE_ENV === "production" ? pageConfig.unstable_runtimeJS : undefined,
    dangerousAsPath: router.asPath,
    ampState,
    initState: reactApplicationContext?.getState() || {},
    props,
    headTags: await headTags(documentCtx),
    isFallback,
    docProps,
    pathname,
    ampPath,
    query,
    inAmpMode,
    hybridAmp,
    dynamicImportsIds,
    dynamicImports,
    // gsp: !!getStaticProps ? true : undefined,
    // gssp: !!getServerSideProps ? true : undefined,
    // gip: hasPageGetInitialProps ? true : undefined,
    // gsp: true,
    // gssp: true,
    ssr: isSSR,
    gip: true,
    appGip: !defaultAppGetInitialProps ? true : undefined,
    devOnlyCacheBusterQueryString,
  });

  if (process.env.NODE_ENV !== "production") {
    const nonRenderedComponents = [];
    const expectedDocComponents = ["Main", "Head", "JoyScript", "Html"];

    for (const comp of expectedDocComponents) {
      if (!(docComponentsRendered as any)[comp]) {
        nonRenderedComponents.push(comp);
      }
    }
    const plural = nonRenderedComponents.length !== 1 ? "s" : "";

    if (nonRenderedComponents.length) {
      console.warn(
        `Expected Document Component${plural} ${nonRenderedComponents.join(", ")} ${
          plural ? "were" : "was"
        } not rendered. Make sure you render them in your custom \`_document\`\n` +
          `See more info here https://err.sh/next.js/missing-document-component`
      );
    }
  }

  if (inAmpMode && html) {
    // inject HTML to AMP_RENDER_TARGET to allow rendering
    // directly to body in AMP mode
    const ampRenderIndex = html.indexOf(AMP_RENDER_TARGET);
    html = html.substring(0, ampRenderIndex) + `<!-- __JOY_DATA__ -->${docProps.html}` + html.substring(ampRenderIndex + AMP_RENDER_TARGET.length);
    html = await optimizeAmp(html, renderOpts.ampOptimizerConfig);

    if (!renderOpts.ampSkipValidation && renderOpts.ampValidator) {
      await renderOpts.ampValidator(html, pathname);
    }
  }

  html = await postProcess(
    html,
    {
      getFontDefinition,
    },
    {
      optimizeFonts: renderOpts.optimizeFonts,
      optimizeImages: renderOpts.optimizeImages,
    }
  );

  if (inAmpMode || hybridAmp) {
    // fix &amp being escaped for amphtml rel link
    html = html.replace(/&amp;amp=1/g, "&amp=1");
  }

  return html;
}

function errorToJSON(err: Error): Error {
  const { name, message, stack } = err;
  return { name, message, stack };
}

function serializeError(dev: boolean | undefined, err: Error): Error & { statusCode?: number } {
  if (dev) {
    return errorToJSON(err);
  }

  return {
    name: "Internal Server Error.",
    message: "500 - Internal Server Error.",
    statusCode: 500,
  };
}
