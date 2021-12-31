import { matchPath } from "react-router";
import { ReactAppInitManager, ReactComponent, ReactRouteInitStatus } from "@symph/react";
import { isDynamicRoute } from "./router/router-utils";
import { parseRelativeUrl } from "../joy-server/lib/router/utils/parse-relative-url";
import { addBasePath } from "../joy-server/lib/router/router";
import getAssetPathFromRoute from "../joy-server/lib/router/utils/get-asset-path-from-route";
import { JoyClientConfig } from "../client/joy-client-config";
import { ClientSsgManifest } from "../build/joy-build.service";
import { ClientBuildManifest } from "../build/webpack/plugins/build-manifest-plugin";
import { TaskThenable } from "@symph/core/dist/utils/task-thenable";

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
  path: string;
  ssgData?: any[]; // 服务端渲染的数据
}

@ReactComponent()
export class JoyReactAppInitManagerClient extends ReactAppInitManager {
  private ssgManifest: Set<string> | undefined;
  private ssgPages: Map<string, JoySSGPage> = new Map<string, JoySSGPage>();

  private promisedBuildManifest?: Promise<ClientBuildManifest>;
  private promisedSsgManifest: Promise<ClientSsgManifest>;

  constructor(private joyClientConfig: JoyClientConfig) {
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
      if ((window as any).__SSG_MANIFEST) {
        resolve((window as any).__SSG_MANIFEST);
      } else {
        (window as any).__SSG_MANIFEST_CB = () => {
          this.ssgManifest = (window as any).__SSG_MANIFEST;
          resolve(this.ssgManifest as ClientSsgManifest);
        };
      }
    });
  }

  // public getPageSSGState(pathname: string): Promise<JoySSGPage | undefined> | JoySSGPage | undefined {
  //   this.ssgManifest = new Set(["/docs/*"]);
  //   // this._cachedSSgManifest = new Set(["\u002Fdynamic\u002F:id", '/static', '/stateful' ])
  //
  //   const ssgPage = this.ssgPages.get(pathname);
  //   if (ssgPage) {
  //     return ssgPage;
  //   } else {
  //   }
  //
  //   // todo pref: 将动态路由分开，提升比较效率。
  //   const check = (ssgManifest: Set<string>): JoySSGPage | undefined => {
  //     let ssgRoutePath: string | undefined;
  //     for (const ssgRoute of ssgManifest.values()) {
  //       if (ssgRoute === pathname) {
  //         ssgRoutePath = ssgRoute;
  //       } else if (isDynamicRoute(ssgRoute) && matchPath({ path: ssgRoute, end: false }, pathname)) {
  //         ssgRoutePath = ssgRoute;
  //       }
  //       if (ssgRoutePath) {
  //         break;
  //       }
  //     }
  //     if (ssgRoutePath) {
  //       return {
  //         pathname,
  //         path: ssgRoutePath,
  //       } as JoySSGPage;
  //     }
  //     return undefined;
  //   };
  //
  //   if (this.ssgManifest) {
  //     return check(this.ssgManifest);
  //   } else {
  //     return this.promisedSsgManifest.then((ssgManifest) => {
  //       this.ssgManifest = ssgManifest;
  //       return check(ssgManifest);
  //     });
  //   }
  // }

  public getPageSSGState(pathname: string, routePath?: string): Promise<JoySSGPage | undefined> | JoySSGPage | undefined {
    // this.ssgManifest = new Set(["/", "/docs/*"]);

    const cache = this.ssgPages.get(pathname);
    if (cache) {
      const initState = this.getPathState(pathname);
      if (initState.initStatic !== ReactRouteInitStatus.SUCCESS) {
        this.setInitState(pathname, { initStatic: ReactRouteInitStatus.LOADING });
      }
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
            path: ssgRoutePath,
          } as JoySSGPage;
          this.ssgPages.set(pathname, ssgPage);
          return ssgPage;
        }
        return undefined;
      })
      .then((ssgPage) => {
        if (ssgPage) {
          const initState = this.getPathState(pathname);
          if (!ssgPage.ssgData) {
            if (initState.initStatic !== ReactRouteInitStatus.SUCCESS) {
              this.setInitState(pathname, { initStatic: ReactRouteInitStatus.LOADING });
              return new Promise<JoySSGPage>((resolve, reject) => {
                this.fetchSSGData(pathname).then((data) => {
                  ssgPage.ssgData = data;
                  resolve(ssgPage);
                }, reject);
              });
            } else {
              // 首次加载页面，html中已经包含了数据了，所以异步加载。
              this.fetchSSGData(pathname).then((data) => {
                ssgPage.ssgData = data;
              });
            }
          }
        }
        return ssgPage;
      });

    return task.getResult();
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

    return data;
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
