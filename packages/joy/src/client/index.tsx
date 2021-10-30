/* global location */
import React from "react";
import ReactDOM from "react-dom";
import { HeadManagerContext } from "../joy-server/lib/head-manager-context";
import mitt from "../joy-server/lib/mitt";
import { RouterContext } from "../joy-server/lib/router-context";
import { delBasePath, hasBasePath } from "../joy-server/lib/router/router";
import type Router from "../joy-server/lib/router/router";
import type { AppComponent, AppProps, PrivateRouteInfo } from "../joy-server/lib/router/router";
import { isDynamicRoute } from "../joy-server/lib/router/utils/is-dynamic";
import * as querystring from "../joy-server/lib/router/utils/querystring";
import * as envConfig from "../joy-server/lib/runtime-config";
import { getURL, loadGetInitialProps, ST } from "../joy-server/lib/utils";
import type { JOY_DATA } from "../joy-server/lib/utils";
import initHeadManager from "./head-manager";
import PageLoader, { looseToArray, StyleSheetTuple } from "./page-loader";
import measureWebVitals from "./performance-relayer";
import { createRouter, makePublicRouterInstance } from "./router";
import { CoreContainer } from "@symph/core";
import { JoyReactAppClientConfiguration } from "../react/joy-react-app-client.configuration";
import { ReactAppContainer, ApplicationConfig, ReactApplicationContext } from "@symph/react";
import { JoyClientConfig } from "./joy-client-config";
import { JoyReactApplicationContext } from "../react/joy-react-application-context";

/// <reference types="react-dom/experimental" />

declare let __webpack_public_path__: string;

declare global {
  interface Window {
    /* test fns */
    __JOY_HYDRATED?: boolean;
    __JOY_HYDRATED_CB?: () => void;

    /* prod */
    __JOY_PRELOADREADY?: (ids?: string[]) => void;
    __JOY_DATA__: JOY_DATA;
    __JOY_P: any[];
  }
}

type RenderRouteInfo = PrivateRouteInfo & {
  App: AppComponent;
  reactApplicationContext: ReactApplicationContext;
};
type RenderErrorProps = Omit<RenderRouteInfo, "Component" | "styleSheets">;

const data: typeof window["__JOY_DATA__"] = JSON.parse(document.getElementById("__JOY_DATA__")!.textContent!);
window.__JOY_DATA__ = data;

export const version = process.env.__JOY_VERSION;

const { initState: hydrateInitState, props: hydrateProps, err: hydrateErr, page, query, buildId, assetPrefix, runtimeConfig, dynamicIds, isFallback } = data;

const prefix = assetPrefix || "";

// With dynamic assetPrefix it's no longer possible to set assetPrefix at the build time
// So, this is how we do it in the client side at runtime
__webpack_public_path__ = `${prefix}/_joy/`; //eslint-disable-line
// Initialize joy/config with the environment configuration
envConfig.setConfig({
  serverRuntimeConfig: {},
  publicRuntimeConfig: runtimeConfig || {},
});

let asPath = getURL();

// make sure not to attempt stripping basePath for 404s
if (hasBasePath(asPath)) {
  asPath = delBasePath(asPath);
}

type RegisterFn = (input: [string, () => void]) => void;

const pageLoader = new PageLoader(buildId, prefix, page);
const register: RegisterFn = ([r, f]) => pageLoader.registerPage(r, f);
if (window.__JOY_P) {
  // Defer page registration for another tick. This will increase the overall
  // latency in hydrating the page, but reduce the total blocking time.
  window.__JOY_P.map((p) => setTimeout(() => register(p), 0));
}
window.__JOY_P = [];
(window.__JOY_P as any).push = register;

const headManager = initHeadManager();
const appElement = document.getElementById("__joy");

let lastAppProps: AppProps;
let lastRenderReject: (() => void) | null;
let webpackHMR: any;
export let router: Router;
let CachedComponent: React.ComponentType;
let cachedStyleSheets: StyleSheetTuple[];
let CachedApp: AppComponent, onPerfEntry: (metric: any) => void;

class Container extends React.Component<{
  fn: (err: Error, info?: any) => void;
}> {
  componentDidCatch(componentErr: Error, info: any) {
    this.props.fn(componentErr, info);
  }

  componentDidMount() {
    this.scrollToHash();

    // We need to replace the router state if:
    // - the page was (auto) exported and has a query string or search (hash)
    // - it was auto exported and is a dynamic route (to provide params)
    // - if it is a client-side skeleton (fallback render)
    if (router.isSsr && (isFallback || (data.joyExport && (isDynamicRoute(router.pathname) || location.search)) || (hydrateProps && hydrateProps.__N_SSG && location.search))) {
      // update query on mount for exported pages
      router.replace(router.pathname + "?" + String(querystring.assign(querystring.urlQueryToSearchParams(router.query), new URLSearchParams(location.search))), asPath, {
        // @ts-ignore
        // WARNING: `_h` is an internal option for handing Joy.js
        // client-side hydration. Your app should _never_ use this property.
        // It may change at any time without notice.
        _h: 1,
        // Fallback pages must trigger the data fetch, so the transition is
        // not shallow.
        // Other pages (strictly updating query) happens shallowly, as data
        // requirements would already be present.
        shallow: !isFallback,
      });
    }

    if (process.env.__JOY_TEST_MODE) {
      window.__JOY_HYDRATED = true;

      if (window.__JOY_HYDRATED_CB) {
        window.__JOY_HYDRATED_CB();
      }
    }
  }

  componentDidUpdate() {
    this.scrollToHash();
  }

  scrollToHash() {
    let { hash } = location;
    hash = hash && hash.substring(1);
    if (!hash) return;

    const el = document.getElementById(hash);
    if (!el) return;

    // If we call scrollIntoView() in here without a setTimeout
    // it won't scroll properly.
    setTimeout(() => el.scrollIntoView(), 0);
  }

  render() {
    if (process.env.NODE_ENV === "production") {
      return this.props.children;
    } else {
      const { ReactDevOverlay } = require("@next/react-dev-overlay/lib/client");
      return <ReactDevOverlay>{this.props.children}</ReactDevOverlay>;
    }
  }
}

export const emitter = mitt();

export default async (opts: { webpackHMR?: any } = {}) => {
  // This makes sure this specific lines are removed in production
  if (process.env.NODE_ENV === "development") {
    webpackHMR = opts.webpackHMR;
  }
  const { page: app, mod } = await pageLoader.loadPage("/_app");
  CachedApp = app as AppComponent;

  if (mod && mod.reportWebVitals) {
    onPerfEntry = ({ id, name, startTime, value, duration, entryType, entries }) => {
      // Combines timestamp with random number for unique ID
      const uniqueID = `${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
      let perfStartEntry;

      if (entries && entries.length) {
        perfStartEntry = entries[0].startTime;
      }

      mod.reportWebVitals({
        id: id || uniqueID,
        name,
        startTime: startTime || perfStartEntry,
        value: value == null ? duration : value,
        label: entryType === "mark" || entryType === "measure" ? "custom" : "web-vital",
      });
    };
  }

  let initialErr = hydrateErr;

  try {
    // ;({
    //   page: CachedComponent,
    //   styleSheets: cachedStyleSheets,
    // } = await pageLoader.loadPage(page)) // todo 重构改功能，不在需要从服务端下载页面的chunk了
    //
    CachedComponent = () => <div>aaa</div>;

    if (process.env.NODE_ENV !== "production") {
      const { isValidElementType } = require("react-is");
      if (!isValidElementType(CachedComponent)) {
        throw new Error(`The default export is not a React Component in page: "${page}"`);
      }
    }
  } catch (error) {
    // This catches errors like throwing in the top level of a module
    initialErr = error;
  }

  if (process.env.NODE_ENV === "development") {
    const { getNodeError } = require("@next/react-dev-overlay/lib/client");
    // Server-side runtime errors need to be re-thrown on the client-side so
    // that the overlay is rendered.
    if (initialErr) {
      if (initialErr === hydrateErr) {
        setTimeout(() => {
          let error;
          try {
            // Generate a new error object. We `throw` it because some browsers
            // will set the `stack` when thrown, and we want to ensure ours is
            // not overridden when we re-throw it below.
            throw new Error(initialErr!.message);
          } catch (e) {
            error = e;
          }

          error.name = initialErr!.name;
          error.stack = initialErr!.stack;

          const node = getNodeError(error);
          throw node;
        });
      }
      // We replaced the server-side error with a client-side error, and should
      // no longer rewrite the stack trace to a Node error.
      else {
        setTimeout(() => {
          throw initialErr;
        });
      }
    }
  }

  if (window.__JOY_PRELOADREADY) {
    await window.__JOY_PRELOADREADY(dynamicIds);
  }

  router = createRouter(page, query, asPath, {
    initialProps: hydrateProps,
    pageLoader,
    App: CachedApp,
    Component: CachedComponent,
    initialStyleSheets: cachedStyleSheets,
    wrapApp,
    err: initialErr,
    isFallback: Boolean(isFallback),
    subscription: ({ Component, styleSheets, props, err }, App) =>
      render({
        App,
        Component,
        styleSheets,
        props,
        err,
        reactApplicationContext,
      }),
  });

  // call init-client middleware
  if (process.env.__JOY_PLUGINS) {
    // @ts-ignore
    // eslint-disable-next-line
    import("joy-plugin-loader?middleware=on-init-client!")
      .then((initClientModule) => {
        return initClientModule.default({ router });
      })
      .catch((initClientErr) => {
        console.error("Error calling client-init for plugins", initClientErr);
      });
  }

  const applicationConfig = new ApplicationConfig();
  const joyContainer = new CoreContainer();
  joyContainer.addProviders([
    {
      name: "joyClientConfig",
      type: JoyClientConfig,
      useFactory: () => {
        return JoyClientConfig.fromJoyData(data);
      },
    },
  ]);
  const reactApplicationContext = new JoyReactApplicationContext(JoyReactAppClientConfiguration, applicationConfig, joyContainer, hydrateInitState);
  await reactApplicationContext.init();

  const renderCtx = {
    App: CachedApp,
    Component: CachedComponent,
    styleSheets: cachedStyleSheets,
    props: hydrateProps,
    err: initialErr,
    reactApplicationContext,
  };

  if (process.env.NODE_ENV === "production") {
    render(renderCtx);
    return emitter;
  } else {
    return { emitter, render, renderCtx };
  }
};

export async function render(renderingProps: RenderRouteInfo) {
  if (renderingProps.err) {
    await renderError(renderingProps);
    return;
  }

  try {
    await doRender(renderingProps);
  } catch (renderErr) {
    // bubble up cancelation errors
    if (renderErr.cancelled) {
      throw renderErr;
    }

    if (process.env.NODE_ENV === "development") {
      // Ensure this error is displayed in the overlay in development
      setTimeout(() => {
        throw renderErr;
      });
    }
    await renderError({ ...renderingProps, err: renderErr });
  }
}

// This method handles all runtime and debug errors.
// 404 and 500 errors are special kind of errors
// and they are still handle via the main render method.
export function renderError(renderErrorProps: RenderErrorProps) {
  const { App, err, reactApplicationContext } = renderErrorProps;

  // In development runtime errors are caught by our overlay
  // In production we catch runtime errors using componentDidCatch which will trigger renderError
  if (process.env.NODE_ENV !== "production") {
    // A Joy.js rendering runtime error is always unrecoverable
    // FIXME: let's make this recoverable (error in GIP client-transition)
    webpackHMR.onUnrecoverableError();

    // We need to render an empty <App> so that the `<ReactDevOverlay>` can
    // render itself.
    return doRender({
      App: () => null,
      props: {},
      Component: () => null,
      styleSheets: [],
      reactApplicationContext,
    });
  }
  if (process.env.__JOY_PLUGINS) {
    // @ts-ignore
    // eslint-disable-next-line
    import("joy-plugin-loader?middleware=on-error-client!")
      .then((onClientErrorModule) => {
        return onClientErrorModule.default({ err });
      })
      .catch((onClientErrorErr) => {
        console.error("error calling on-error-client for plugins", onClientErrorErr);
      });
  }

  // Make sure we log the error to the console, otherwise users can't track down issues.
  console.error(err);
  return pageLoader.loadPage("/_error").then(({ page: ErrorComponent, styleSheets }) => {
    // In production we do a normal render with the `ErrorComponent` as component.
    // If we've gotten here upon initial render, we can use the props from the server.
    // Otherwise, we need to call `getInitialProps` on `App` before mounting.
    const AppTree = wrapApp(App);
    const appCtx = {
      Component: ErrorComponent,
      AppTree,
      router,
      ctx: { err, pathname: page, query, asPath, AppTree },
    };
    return Promise.resolve(renderErrorProps.props ? renderErrorProps.props : loadGetInitialProps(App, appCtx)).then((initProps) =>
      doRender({
        ...renderErrorProps,
        err,
        Component: ErrorComponent,
        styleSheets,
        props: initProps,
      })
    );
  });
}

// If hydrate does not exist, eg in preact.
let isInitialRender = typeof ReactDOM.hydrate === "function";
let reactRoot: any = null;

function renderReactElement(reactEl: JSX.Element, domEl: HTMLElement) {
  if (process.env.__JOY_REACT_MODE !== "legacy") {
    if (!reactRoot) {
      const opts = { hydrate: true };
      reactRoot = process.env.__JOY_REACT_MODE === "concurrent" ? (ReactDOM as any).unstable_createRoot(domEl, opts) : (ReactDOM as any).unstable_createBlockingRoot(domEl, opts);
    }
    reactRoot.render(reactEl);
  } else {
    // mark start of hydrate/render
    if (ST) {
      performance.mark("beforeRender");
    }

    // The check for `.hydrate` is there to support React alternatives like preact
    if (isInitialRender) {
      ReactDOM.hydrate(reactEl, domEl, markHydrateComplete);
      isInitialRender = false;

      if (onPerfEntry && ST) {
        measureWebVitals(onPerfEntry);
      }
    } else {
      ReactDOM.render(reactEl, domEl, markRenderComplete);
    }
  }
}

function markHydrateComplete() {
  if (!ST) return;

  performance.mark("afterHydrate"); // mark end of hydration

  performance.measure("Joy.js-before-hydration", "navigationStart", "beforeRender");
  performance.measure("Joy.js-hydration", "beforeRender", "afterHydrate");

  if (onPerfEntry) {
    performance.getEntriesByName("Joy.js-hydration").forEach(onPerfEntry);
  }
  clearMarks();
}

function markRenderComplete() {
  if (!ST) return;

  performance.mark("afterRender"); // mark end of render
  const navStartEntries = performance.getEntriesByName("routeChange", "mark");

  if (!navStartEntries.length) {
    return;
  }

  performance.measure("Joy.js-route-change-to-render", navStartEntries[0].name, "beforeRender");
  performance.measure("Joy.js-render", "beforeRender", "afterRender");
  if (onPerfEntry) {
    performance.getEntriesByName("Joy.js-render").forEach(onPerfEntry);
    performance.getEntriesByName("Joy.js-route-change-to-render").forEach(onPerfEntry);
  }
  clearMarks();
  ["Joy.js-route-change-to-render", "Joy.js-render"].forEach((measure) => performance.clearMeasures(measure));
}

function clearMarks() {
  ["beforeRender", "afterHydrate", "afterRender", "routeChange"].forEach((mark) => performance.clearMarks(mark));
}

function AppContainer({ children }: React.PropsWithChildren<{}>): React.ReactElement {
  return (
    <Container
      fn={(error) =>
        // @ts-ignore todo ！！！ 添加reactApplicationContext:入参
        renderError({ App: CachedApp, err: error }).catch((err) => console.error("Error rendering page: ", err))
      }
    >
      <RouterContext.Provider value={makePublicRouterInstance(router)}>
        <HeadManagerContext.Provider value={headManager}>{children}</HeadManagerContext.Provider>
      </RouterContext.Provider>
    </Container>
  );
}

const wrapApp = (App: AppComponent) => (wrappedAppProps: Record<string, any>) => {
  const appProps: AppProps = {
    ...wrappedAppProps,
    Component: CachedComponent,
    err: hydrateErr,
    router,
  };
  return (
    <AppContainer>
      <App {...appProps} />
    </AppContainer>
  );
};

function doRender({ App, Component, props, err, styleSheets, reactApplicationContext }: RenderRouteInfo): Promise<any> {
  Component = Component || lastAppProps.Component;
  props = props || lastAppProps.props;

  const appProps: AppProps = {
    ...props,
    Component,
    err,
    router,
  };
  // lastAppProps has to be set before ReactDom.render to account for ReactDom throwing an error.
  lastAppProps = appProps;

  let canceled = false;
  let resolvePromise: () => void;
  const renderPromise = new Promise<void>((resolve, reject) => {
    if (lastRenderReject) {
      lastRenderReject();
    }
    resolvePromise = () => {
      lastRenderReject = null;
      resolve();
    };
    lastRenderReject = () => {
      canceled = true;
      lastRenderReject = null;

      const error: any = new Error("Cancel rendering route");
      error.cancelled = true;
      reject(error);
    };
  });

  // This function has a return type to ensure it doesn't start returning a
  // Promise. It should remain synchronous.
  function onStart(): boolean {
    if (
      // We can skip this during hydration. Running it wont cause any harm, but
      // we may as well save the CPU cycles.
      isInitialRender ||
      // We use `style-loader` in development, so we don't need to do anything
      // unless we're in production:
      process.env.NODE_ENV !== "production"
    ) {
      return false;
    }

    const currentStyleTags = looseToArray<HTMLStyleElement>(document.querySelectorAll("style[data-n-href]"));
    const currentHrefs = new Set(currentStyleTags.map((tag) => tag.getAttribute("data-n-href")));

    styleSheets.forEach(({ href, text }) => {
      if (!currentHrefs.has(href)) {
        const styleTag = document.createElement("style");
        styleTag.setAttribute("data-n-href", href);
        styleTag.setAttribute("media", "x");

        document.head.appendChild(styleTag);
        styleTag.appendChild(document.createTextNode(text));
      }
    });
    return true;
  }

  function onCommit() {
    if (
      // We use `style-loader` in development, so we don't need to do anything
      // unless we're in production:
      process.env.NODE_ENV === "production" &&
      // We can skip this during hydration. Running it wont cause any harm, but
      // we may as well save the CPU cycles:
      !isInitialRender &&
      // Ensure this render was not canceled
      !canceled
    ) {
      const desiredHrefs = new Set(styleSheets.map((s) => s.href));
      const currentStyleTags = looseToArray<HTMLStyleElement>(document.querySelectorAll("style[data-n-href]"));
      const currentHrefs = currentStyleTags.map((tag) => tag.getAttribute("data-n-href")!);

      // Toggle `<style>` tags on or off depending on if they're needed:
      for (let idx = 0; idx < currentHrefs.length; ++idx) {
        if (desiredHrefs.has(currentHrefs[idx])) {
          currentStyleTags[idx].removeAttribute("media");
        } else {
          currentStyleTags[idx].setAttribute("media", "x");
        }
      }

      // Reorder styles into intended order:
      let referenceNode = document.querySelector("noscript[data-n-css]");
      if (
        // This should be an invariant:
        referenceNode
      ) {
        styleSheets.forEach(({ href }) => {
          const targetTag = document.querySelector(`style[data-n-href="${href}"]`);
          if (
            // This should be an invariant:
            targetTag
          ) {
            referenceNode!.parentNode!.insertBefore(targetTag, referenceNode!.nextSibling);
            referenceNode = targetTag;
          }
        });
      }

      // Finally, clean up server rendered stylesheets:
      looseToArray<HTMLLinkElement>(document.querySelectorAll("link[data-n-p]")).forEach((el) => {
        el.parentNode!.removeChild(el);
      });

      // Force browser to recompute layout, which should prevent a flash of
      // unstyled content:
      getComputedStyle(document.body, "height");
    }

    resolvePromise();
  }

  const elem = (
    <Root callback={onCommit}>
      <AppContainer>
        <ReactAppContainer
          appContext={reactApplicationContext}
          Component={App as any} // todo 定义参数的类型
        />
      </AppContainer>
    </Root>
  );

  onStart();

  // We catch runtime errors using componentDidCatch which will trigger renderError
  renderReactElement(process.env.__JOY_STRICT_MODE ? <React.StrictMode>{elem}</React.StrictMode> : elem, appElement!);

  return renderPromise;
}

function Root({
  callback,
  children,
}: React.PropsWithChildren<{
  callback: () => void;
}>): React.ReactElement {
  // We use `useLayoutEffect` to guarantee the callback is executed
  // as soon as React flushes the update.
  React.useLayoutEffect(() => callback(), [callback]);
  return children as React.ReactElement;
}
