import { matchPath } from "react-router";
import { ReactAppInitManager, ReactComponent, ReactRouteInitStatus, ReactRouterService } from "@symph/react";
import { isDynamicRoute } from "./router/router-utils";
import { parseRelativeUrl } from "../joy-server/lib/router/utils/parse-relative-url";
import { addBasePath } from "../joy-server/lib/router/router";
import getAssetPathFromRoute from "../joy-server/lib/router/utils/get-asset-path-from-route";
import { JoyClientConfig } from "../client/joy-client-config";
import { ClientSsgManifest } from "../build/joy-build.service";
import { ClientBuildManifest } from "../build/webpack/plugins/build-manifest-plugin";
import { TaskThenable } from "@symph/core/dist/utils/task-thenable";
import { Inject } from "@symph/core";
import { RouteSSGData } from "../joy-server/lib/RouteSSGData.interface";

const PAGE_LOAD_ERROR = Symbol("PAGE_LOAD_ERROR");

// interface JoyReactAppInitManagerState extends ReactAppInitManagerState {
//   [pathname: string]: {
//     init: ReactRouteInitStatus;
//     initStatic: ReactRouteInitStatus;
//     hasSSG?: boolean; // 是否有服务端渲染
//     ssgData?: Record<string, any>; // 服务端渲染的数据
//   };
// }

export interface JoySSGPage {
  pathname: string;
  routeSSGDataList: RouteSSGData[]; // 服务端渲染的数据
  loadingTask?: Promise<RouteSSGData[]>;
  loadingRoutes?: string[];
}

@ReactComponent()
export class JoyReactAppInitManagerClient extends ReactAppInitManager {
  private ssgManifest: Set<string> | undefined;
  private ssgPages: Map<string, JoySSGPage> = new Map<string, JoySSGPage>();
  private ssgRouteDataCache: Map<string, RouteSSGData> = new Map<string, RouteSSGData>();

  private promisedBuildManifest?: Promise<ClientBuildManifest>;
  private promisedSsgManifest: Promise<ClientSsgManifest>;

  constructor(
    private joyClientConfig: JoyClientConfig,
    @Inject("joyPrerenderRoutes") private joyPrerenderRoutes: string[],
    private reactRouter: ReactRouterService
  ) {
    super();

    this.promisedBuildManifest = new Promise((resolve) => {
      if ((window as any).__BUILD_MANIFEST) {
        resolve((window as any).__BUILD_MANIFEST);
      } else {
        (window as any).__BUILD_MANIFEST_CB = () => {
          resolve((window as any).__BUILD_MANIFEST);
        };
      }
    });

    this.promisedSsgManifest = new Promise((resolve) => {
      if (joyClientConfig.joyExport) {
        // 导出后运行的版本
        if ((window as any).__SSG_MANIFEST) {
          resolve((window as any).__SSG_MANIFEST);
        } else {
          (window as any).__SSG_MANIFEST_CB = () => {
            this.ssgManifest = (window as any).__SSG_MANIFEST;
            resolve(this.ssgManifest as ClientSsgManifest);
          };
        }
      } else {
        // node运行模式或者开发模式
        this.ssgManifest = new Set(this.joyPrerenderRoutes);
        resolve(this.ssgManifest);
      }
    });
  }

  public getPageSSGState(pathname: string, routePath?: string): Promise<JoySSGPage | undefined> | JoySSGPage | undefined {
    const cache = this.ssgPages.get(pathname);
    if (cache) {
      return cache;
    }

    const task = new TaskThenable((resolve, reject) => {
      if (this.ssgManifest) {
        resolve(this.ssgManifest);
      } else {
        resolve(
          this.promisedSsgManifest.then((ssgManifest) => {
            this.ssgManifest = ssgManifest;
            return ssgManifest;
          })
        );
      }
    })
      .then((ssgManifest) => {
        let ssgRoutePath: string | undefined;
        // todo pref: 将动态路由分开，提升比较效率。
        for (const ssgRoute of ssgManifest.values()) {
          if (ssgRoute === pathname || ssgRoute === routePath) {
            ssgRoutePath = ssgRoute;
          } else if (isDynamicRoute(ssgRoute) && matchPath({ path: ssgRoute, end: true }, pathname)) {
            ssgRoutePath = ssgRoute;
          }
          if (ssgRoutePath) {
            break;
          }
        }
        if (ssgRoutePath) {
          const ssgPage = {
            pathname,
          } as JoySSGPage;
          this.ssgPages.set(pathname, ssgPage);
          return ssgPage;
        }
        return undefined;
      })
      .then((ssgPage) => {
        if (!ssgPage) {
          return undefined;
        }
        const routesMatched = this.reactRouter.matchRoutes(pathname) || [];
        const caches = routesMatched.map((m) => this.ssgRouteDataCache.get(m.pathname));
        if (caches.indexOf(undefined) < 0) {
          ssgPage.routeSSGDataList = caches as RouteSSGData[];
          return ssgPage;
        }
        ssgPage.routeSSGDataList = caches.map((v, i) => {
          if (v !== undefined) {
            return v;
          }
          const pathname = routesMatched[i].pathname;
          if (!ssgPage.loadingRoutes) {
            ssgPage.loadingRoutes = [];
          }
          ssgPage.loadingRoutes.push(pathname);
          return { pathname, ssgData: undefined };
        }) as RouteSSGData[];

        ssgPage.loadingTask = this.fetchSSGData(pathname).then((data) => {
          ssgPage.routeSSGDataList = data;
          if (data?.length) {
            data.forEach((d) => this.ssgRouteDataCache.set(d.pathname, d));
          }
          return data;
        });
        return ssgPage;
      });

    return task.getResult();
  }

  public setRouteSSGState(routeSSGData: RouteSSGData) {
    this.ssgRouteDataCache.set(routeSSGData.pathname, routeSSGData);
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

  public async fetchSSGData(href: string): Promise<RouteSSGData[]> {
    const dataHref = this.getDataHref(href, false);
    // this.setInitState(href, {
    //   initStatic: ReactRouteInitStatus.LOADING,
    // });
    const data = await this.fetchRetry(dataHref, 1).catch((err: Error) => {
      // We should only trigger a server-side transition if this was caused
      // on a client-side transition. Otherwise, we'd get into an infinite
      // loop.
      Object.defineProperty(err, PAGE_LOAD_ERROR, {});
      this.setInitState(href, {
        initStatic: ReactRouteInitStatus.ERROR,
      });
      throw err;
    });
    // this.setInitState(href, {
    //   initStatic: ReactRouteInitStatus.SUCCESS,
    // });

    return data as RouteSSGData[];
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

function normalizeRoute(route: string) {
  if (route[0] !== "/") {
    throw new Error(`Route name should start with a "/", got "${route}"`);
  }

  if (route === "/") return route;
  return route.replace(/\/$/, "");
}
