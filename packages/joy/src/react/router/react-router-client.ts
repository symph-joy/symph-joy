import { Inject, Component } from "@symph/core";
import { IReactRoute, JoyRouteInitState, ReactAppInitManager, ReactRouter } from "@symph/react";
import { parseRelativeUrl } from "../../joy-server/lib/router/utils/parse-relative-url";
import getAssetPathFromRoute from "../../joy-server/lib/router/utils/get-asset-path-from-route";
import { addBasePath } from "../../joy-server/lib/router/router";
import { normalizePathTrailingSlash } from "../../client/normalize-trailing-slash";
import { JoyClientConfig } from "../../client/joy-client-config";
import { isDynamicRoute } from "../../joy-server/lib/router/utils";
import { matchPath } from "react-router";
import { route } from "../../joy-server/server/router";

type ClientRouteSSG = string[];

const basePath = (process.env.__JOY_ROUTER_BASEPATH as string) || "";
const PAGE_LOAD_ERROR = Symbol("PAGE_LOAD_ERROR");

function normalizeRoute(route: string) {
  if (route[0] !== "/") {
    throw new Error(`Route name should start with a "/", got "${route}"`);
  }

  if (route === "/") return route;
  return route.replace(/\/$/, "");
}

@Component()
export class ReactRouterClient extends ReactRouter {
  private _cachedSSgManifest: Set<string> | undefined;

  constructor(
    @Inject("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[],
    private joyClientConfig: JoyClientConfig,
    private reactAppInitManager: ReactAppInitManager
  ) {
    super();
    this.routes = joyReactAutoGenRoutes.map((it: any) => {
      return {
        ...it,
        component: it.component?.default,
      };
    });
  }

  public getSSGManifest(path: string): Promise<boolean> | boolean {
    // this._cachedSSgManifest = new Set(["\u002Fdynamic\u002F:id", '/static', '/stateful' ])
    if (!this._cachedSSgManifest && (window as any).__SSG_MANIFEST) {
      this._cachedSSgManifest = (window as any).__SSG_MANIFEST;
    }
    // todo pref: 将动态路由分开，提升比较效率。
    const check = (ssgManifest: Set<string>): boolean => {
      for (const ssgRoute of ssgManifest.values()) {
        if (ssgRoute === path) {
          return true;
        } else if (isDynamicRoute(ssgRoute) && matchPath(path, { path: ssgRoute })) {
          return true;
        }
      }
      return false;
    };

    if (this._cachedSSgManifest) {
      return check(this._cachedSSgManifest);
    } else {
      return new Promise<Set<string>>((resolve) => {
        (window as any).__SSG_MANIFEST_CB = () => {
          resolve((window as any).__SSG_MANIFEST);
        };
      }).then((ssgManifest) => {
        ssgManifest = ssgManifest || new Set();
        this._cachedSSgManifest = ssgManifest;
        return check(ssgManifest);
      });
    }
  }

  private fetchRetry(url: string, attempts: number): Promise<any> {
    return fetch(url, {
      // Cookies are required to be present for Joy.js' SSG "Preview Mode".
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
    return basePath && path.startsWith("/") ? (path === "/" ? normalizePathTrailingSlash(basePath) : basePath + path) : path;
  }

  public delBasePath(path: string): string {
    return path.slice(basePath.length) || "/";
  }

  /**
   * @param {string} href the URL as shown in browser (virtual path)
   */
  private getDataHref(href: string, ssg: boolean) {
    const { pathname: hrefPathname, searchParams, search } = parseRelativeUrl(href);
    const route = normalizeRoute(hrefPathname);

    const dataRoute = getAssetPathFromRoute(route, ".json");
    return addBasePath(`/_joy/data/${this.joyClientConfig.buildId}${dataRoute}${ssg ? "" : search}`);
  }
}
