import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import { ComponentType } from "react";
import { UrlObject } from "url";
import { formatUrl } from "./router/utils/format-url";
import { ManifestItem } from "../server/load-components";
import { JoyRouter } from "./router/router";
import { Env } from "../../lib/load-env-config";
import { BuildManifest } from "../server/get-page-files";

/**
 * Types used by both joy and joy-server
 */

export type JoyComponentType<C extends BaseContext = JoyPageContext, IP = {}, P = {}> = ComponentType<P> & {
  /**
   * Used for initial page load data population. Data returned from `getInitialProps` is serialized when server rendered.
   * Make sure to return plain `Object` without using `Date`, `Map`, `Set`.
   * @param ctx Context of `page`
   */
  getInitialProps?(context: C): IP | Promise<IP>;
};

export type DocumentType = JoyComponentType<DocumentContext, DocumentInitialProps, DocumentProps> & {
  renderDocument(Document: DocumentType, props: DocumentProps): React.ReactElement;
};

export type AppType = JoyComponentType<AppContextType, AppInitialProps, AppPropsType>;

export type AppTreeType = ComponentType<AppInitialProps & { [name: string]: any }>;

/**
 * Web vitals provided to _app.reportWebVitals by Core Web Vitals plugin developed by Google Chrome team.
 */
export type JoyWebVitalsMetric = {
  id: string;
  label: string;
  name: string;
  startTime: number;
  value: number;
};

export type Enhancer<C> = (Component: C) => C;

export type ComponentsEnhancer =
  | {
      enhanceApp?: Enhancer<AppType>;
      enhanceComponent?: Enhancer<JoyComponentType>;
    }
  | Enhancer<JoyComponentType>;

export type RenderPageResult = {
  html: string;
  head?: Array<JSX.Element | null>;
};

export type RenderPage = (options?: ComponentsEnhancer) => RenderPageResult | Promise<RenderPageResult>;

export type BaseContext = {
  res?: ServerResponse;
  [k: string]: any;
};

export type JOY_DATA = {
  initState: Record<string, any>;
  props: Record<string, any>;
  page: string;
  query: ParsedUrlQuery;
  buildId: string;
  assetPrefix?: string;
  apiPrefix?: string;
  runtimeConfig?: { [key: string]: any };
  joyExport?: boolean;
  autoExport?: boolean;
  isFallback?: boolean;
  dynamicIds?: string[];
  err?: Error & { statusCode?: number };
  // gsp?: boolean;
  // gssp?: boolean;
  ssr?: boolean;
  customServer?: boolean;
  gip?: boolean;
  appGip?: boolean;
};

/**
 * `Joy` context
 */
export interface JoyPageContext {
  /**
   * Error object if encountered during rendering
   */
  err?: (Error & { statusCode?: number }) | null;
  /**
   * `HTTP` request object.
   */
  req?: IncomingMessage;
  /**
   * `HTTP` response object.
   */
  res?: ServerResponse;
  /**
   * Path section of `URL`.
   */
  pathname: string;
  /**
   * Query string section of `URL` parsed as an object.
   */
  query: ParsedUrlQuery;
  /**
   * `String` of the actual path including query.
   */
  asPath?: string;
  /**
   * `Component` the tree of the App to use if needing to render separately
   */
  AppTree: AppTreeType;
}

export type AppContextType<R extends JoyRouter = JoyRouter> = {
  Component: JoyComponentType<JoyPageContext>;
  AppTree: AppTreeType;
  ctx: JoyPageContext;
  router: R;
};

export type AppInitialProps = {
  pageProps: any;
};

export type AppPropsType<R extends JoyRouter = JoyRouter, P = {}> = AppInitialProps & {
  Component: JoyComponentType<JoyPageContext, any, P>;
  router: R;
  __N_SSG?: boolean;
  __N_SSP?: boolean;
};

export type DocumentContext = JoyPageContext & {
  renderPage: RenderPage;
};

export type DocumentInitialProps = RenderPageResult & {
  styles?: React.ReactElement[] | React.ReactFragment;
};

export type DocumentProps = DocumentInitialProps & {
  __JOY_DATA__: JOY_DATA;
  dangerousAsPath: string;
  docComponentsRendered: {
    Html?: boolean;
    Main?: boolean;
    Head?: boolean;
    JoyScript?: boolean;
  };
  buildManifest: BuildManifest;
  ampPath: string;
  inAmpMode: boolean;
  hybridAmp: boolean;
  isDevelopment: boolean;
  dynamicImports: ManifestItem[];
  assetPrefix?: string;
  canonicalBase: string;
  headTags: any[];
  unstable_runtimeJS?: false;
  devOnlyCacheBusterQueryString: string;
};

/**
 * Joy `API` route request
 */
export interface JoyApiRequest extends IncomingMessage {
  /**
   * Object of `query` values from url
   */
  query: {
    [key: string]: string | string[];
  };
  /**
   * Object of `cookies` from header
   */
  cookies: {
    [key: string]: string;
  };

  body: any;

  env: Env;

  preview?: boolean;
  /**
   * Preview data set on the request, if any
   * */
  previewData?: any;
}

/**
 * Send body of response
 */
type Send<T> = (body: T) => void;

/**
 * Joy `API` route response
 */
export type JoyApiResponse<T = any> = ServerResponse & {
  /**
   * Send data `any` data in response
   */
  send: Send<T>;
  /**
   * Send data `json` data in response
   */
  json: Send<T>;
  status: (statusCode: number) => JoyApiResponse<T>;
  redirect(url: string): JoyApiResponse<T>;
  redirect(status: number, url: string): JoyApiResponse<T>;

  /**
   * Set preview data for Joy.js' prerender mode
   */
  setPreviewData: (
    data: object | string,
    options?: {
      /**
       * Specifies the number (in seconds) for the preview session to last for.
       * The given number will be converted to an integer by rounding down.
       * By default, no maximum age is set and the preview session finishes
       * when the client shuts down (browser is closed).
       */
      maxAge?: number;
    }
  ) => JoyApiResponse<T>;
  clearPreviewData: () => JoyApiResponse<T>;
};

/**
 * Joy `API` route handler
 */
export type JoyApiHandler<T = any> = (req: JoyApiRequest, res: JoyApiResponse<T>) => void | Promise<void>;

/**
 * Utils
 */
export function execOnce<T extends (...args: any[]) => ReturnType<T>>(fn: T): T {
  let used = false;
  let result: ReturnType<T>;

  return ((...args: any[]) => {
    if (!used) {
      used = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

export function getLocationOrigin() {
  const { protocol, hostname, port } = window.location;
  return `${protocol}//${hostname}${port ? ":" + port : ""}`;
}

export function getURL() {
  const { href } = window.location;
  const origin = getLocationOrigin();
  return href.substring(origin.length);
}

export function getDisplayName<P>(Component: ComponentType<P>) {
  return typeof Component === "string" ? Component : Component.displayName || Component.name || "Unknown";
}

export function isResSent(res: ServerResponse) {
  return res.finished || res.headersSent;
}

export async function loadGetInitialProps<C extends BaseContext, IP = {}, P = {}>(App: JoyComponentType<C, IP, P>, ctx: C): Promise<IP> {
  if (process.env.NODE_ENV !== "production") {
    if (App.prototype?.getInitialProps) {
      const message = `"${getDisplayName(App)}.getInitialProps()" is defined as an instance method`;
      throw new Error(message);
    }
  }
  // when called from _app `ctx` is nested in `ctx`
  const res = ctx.res || (ctx.ctx && ctx.ctx.res);

  if (!App.getInitialProps) {
    if (ctx.ctx && ctx.Component) {
      // @ts-ignore pageProps default
      return {
        pageProps: await loadGetInitialProps(ctx.Component, ctx.ctx),
      };
    }
    return {} as IP;
  }

  const props = await App.getInitialProps(ctx);

  if (res && isResSent(res)) {
    return props;
  }

  if (!props) {
    const message = `"${getDisplayName(App)}.getInitialProps()" should resolve to an object. But found "${props}" instead.`;
    throw new Error(message);
  }

  if (process.env.NODE_ENV !== "production") {
    if (Object.keys(props).length === 0 && !ctx.ctx) {
      console.warn(
        `${getDisplayName(App)} returned an empty object from \`getInitialProps\`. This de-optimizes and prevents automatic static optimization.`
      );
    }
  }

  return props;
}

export const urlObjectKeys = ["auth", "hash", "host", "hostname", "href", "path", "pathname", "port", "protocol", "query", "search", "slashes"];

export function formatWithValidation(url: UrlObject): string {
  if (process.env.NODE_ENV === "development") {
    if (url !== null && typeof url === "object") {
      Object.keys(url).forEach((key) => {
        if (urlObjectKeys.indexOf(key) === -1) {
          console.warn(`Unknown key passed via urlObject into url.format: ${key}`);
        }
      });
    }
  }

  return formatUrl(url);
}

export const SP = typeof performance !== "undefined";
export const ST = SP && typeof performance.mark === "function" && typeof performance.measure === "function";
