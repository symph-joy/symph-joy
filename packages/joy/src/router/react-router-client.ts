import { Inject, Injectable } from "@symph/core";
import {
  IReactRoute,
  JoyRouteInitState,
  ReactAppInitManager,
  ReactRouter,
} from "@symph/react";
import { parseRelativeUrl } from "../next-server/lib/router/utils/parse-relative-url";
import getAssetPathFromRoute from "../next-server/lib/router/utils/get-asset-path-from-route";
import { addBasePath } from "../next-server/lib/router/router";
import { normalizePathTrailingSlash } from "../client/normalize-trailing-slash";
import { JoyClientConfig } from "../client/joy-client-config";

type ClientRouteSSG = string[];

const basePath = (process.env.__NEXT_ROUTER_BASEPATH as string) || "";
const PAGE_LOAD_ERROR = Symbol("PAGE_LOAD_ERROR");

function normalizeRoute(route: string) {
  if (route[0] !== "/") {
    throw new Error(`Route name should start with a "/", got "${route}"`);
  }

  if (route === "/") return route;
  return route.replace(/\/$/, "");
}

@Injectable()
export class ReactRouterClient extends ReactRouter {
  private _cachedSSgManifest: Set<string> | undefined;

  constructor(
    @Inject("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[],
    private joyClientConfig: JoyClientConfig,
    private reactAppInitManager: ReactAppInitManager
  ) {
    super();
    console.log(">>> load joyReactAutoGenRoutes:", joyReactAutoGenRoutes);
    this.routes = joyReactAutoGenRoutes.map((it: any) => {
      return {
        ...it,
        component: it.component?.default,
      };
    });
  }

  public async getSSGManifest(path: string): Promise<boolean> {
    let ssgManifest: Set<string>;
    if (this._cachedSSgManifest) {
      ssgManifest = this._cachedSSgManifest;
    } else {
      ssgManifest = await new Promise((resolve) => {
        if ((window as any).__SSG_MANIFEST) {
          resolve((window as any).__SSG_MANIFEST);
        } else {
          (window as any).__SSG_MANIFEST_CB = () => {
            resolve((window as any).__SSG_MANIFEST);
          };
        }
      });
    }
    ssgManifest = ssgManifest || new Set();
    return ssgManifest.has(path);
  }

  private fetchRetry(url: string, attempts: number): Promise<any> {
    return fetch(url, {
      // Cookies are required to be present for Next.js' SSG "Preview Mode".
      // Cookies may also be required for `getServerSideProps`.
      //
      // > `fetch` won’t send cookies, unless you set the credentials init
      // > option.
      // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
      //
      // > For maximum browser compatibility when it comes to sending &
      // > receiving cookies, always supply the `credentials: 'same-origin'`
      // > option instead of relying on the default.
      // https://github.com/github/fetch#caveats
      credentials: "same-origin",
    }).then((res) => {
      if (!res.ok) {
        if (attempts > 1 && res.status >= 500) {
          return this.fetchRetry(url, attempts - 1);
        }
        throw new Error(`Failed to load static props`);
      }

      return res.json();
    });
  }

  public async fetchSSGData(href: string) {
    const dataHref = this.getDataHref(href, false);
    this.reactAppInitManager.setInitState(href, {
      initStatic: JoyRouteInitState.LOADING,
    });
    const data = await this.fetchRetry(dataHref, 1).catch((err: Error) => {
      // We should only trigger a server-side transition if this was caused
      // on a client-side transition. Otherwise, we'd get into an infinite
      // loop.
      Object.defineProperty(err, PAGE_LOAD_ERROR, {});
      this.reactAppInitManager.setInitState(href, {
        initStatic: JoyRouteInitState.ERROR,
      });
      throw err;
    });
    this.reactAppInitManager.setInitState(href, {
      initStatic: JoyRouteInitState.SUCCESS,
    });

    return data;
  }

  public addBasePath(path: string): string {
    // we only add the basepath on relative urls
    return basePath && path.startsWith("/")
      ? path === "/"
        ? normalizePathTrailingSlash(basePath)
        : basePath + path
      : path;
  }

  public delBasePath(path: string): string {
    return path.slice(basePath.length) || "/";
  }

  /**
   * @param {string} href the URL as shown in browser (virtual path)
   */
  private getDataHref(href: string, ssg: boolean) {
    const { pathname: hrefPathname, searchParams, search } = parseRelativeUrl(
      href
    );
    const route = normalizeRoute(hrefPathname);

    const dataRoute = getAssetPathFromRoute(route, ".json");
    return addBasePath(
      `/_next/data/${this.joyClientConfig.buildId}${dataRoute}${
        ssg ? "" : search
      }`
    );
  }
}
