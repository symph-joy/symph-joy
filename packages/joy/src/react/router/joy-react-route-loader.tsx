import React, { ComponentType, useContext, useEffect, useMemo, useState } from "react";
import { IReactRoute, ReactApplicationReactContext, JoyRouteInitState, MountModule, ReactAppInitManager } from "@symph/react";
import { ReactRouterClient } from "./react-router-client";
import * as H from "history";
import { PathMatch, useLocation, useMatch, useNavigate } from "react-router-dom";
import { DynamicLoading, Loader } from "../../joy-server/lib/dynamic";
import { RuntimeException } from "@symph/core";
import { isDynamicRoute } from "./router-utils";
import { getRouteElement } from "@symph/react/dist/router/react-route-loader";
import { IJoyReactRouteBuild } from "./joy-react-router-plugin";

type JoyReactRouteLoaderOptions = {
  // match: PathMatch;
  // location: H.Location;
  // history: H.History;
  extraProps: Record<string, any>;
  route: IJoyReactRouteBuild;

  // component: ComponentType | { default: ComponentType };
  loader?: Loader;
  loading?: DynamicLoading;

  // componentName: string;
  // componentModule: Record<string, unknown> | (() => Promise<Record<string, unknown>>);
};

const DefaultLoadingComp = ({ match, location, route }: { match: PathMatch; location: H.Location; route: IReactRoute }) => (
  <div>{match.pathname} loading...</div>
);

export function JoyReactRouteLoader({ route, loading }: JoyReactRouteLoaderOptions) {
  const { ssr, joyExport } = window.__JOY_DATA__;
  const navigate = useNavigate();
  const location = useLocation();
  const match = useMatch({ path: route.path, end: !route.children?.length });
  if (!match) {
    throw new RuntimeException(`React route load error: Route ${route.path} is not match location: ${location.pathname}`);
  }
  const { pathname: matchUrl } = match;
  const joyAppContext = useContext(ReactApplicationReactContext);
  if (!joyAppContext) {
    throw new Error("react app context is not initialed");
  }
  if (route.catchAllParam) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 特殊处理，填入catchAllParam的值。
    match.params[route.catchAllParam] = match.params["*"];
  }

  let routeElement: React.ReactElement | Promise<React.ReactElement> = useMemo(() => {
    return getRouteElement(joyAppContext, route, match, location, navigate);
  }, [matchUrl]);

  // prefetch Data
  const router = joyAppContext.getSync(ReactRouterClient);
  const href = location.pathname;

  /**
   * 是否采用ssg数据的条件：
   * 1. 预渲染的静态路由页面，revalidate为false。
   * 2. 预渲染的动态路由页面，fallback为false，revalidate为false。
   */
  const isUseSSGData = useMemo(() => {
    if (!ssr) {
      return false;
    }
    const check = (ssgInfo: boolean) => {
      if (!ssgInfo) {
        return false;
      }
      return true;
    };

    const ssgInfo = router.getSSGManifest(match.pathname);
    if (ssgInfo instanceof Promise) {
      return ssgInfo.then(check);
    } else {
      return check(ssgInfo);
    }
  }, [matchUrl]);

  const [loadingState, setLoadingStat] = useState({
    isDataLoading: false,
    isCompLoading: routeElement instanceof Promise,
  });

  // fetch page data
  useEffect(() => {
    Promise.resolve(isUseSSGData).then((isUseSSG) => {
      if (isUseSSG) {
        if (loadingState.isDataLoading) {
          return;
        }
        setLoadingStat({ isDataLoading: true, isCompLoading: loadingState.isCompLoading });

        router
          .fetchSSGData(href)
          .then((ssgData: Array<any>) => {
            // todo merge store state
            if (ssgData && ssgData.length) {
              for (const data of ssgData) {
                joyAppContext.dispatch(data);
              }
            }
          })
          .catch((e) => {
            console.error(e);
            // });
          })
          .finally(() => {
            setLoadingStat({ isDataLoading: false, isCompLoading: loadingState.isCompLoading });
          });
        return;
      } else {
        if (loadingState.isDataLoading) {
          setLoadingStat({ isDataLoading: false, isCompLoading: loadingState.isCompLoading });
        }
      }
    });

    Promise.resolve(routeElement).then((Ctl) => {
      if (loadingState.isCompLoading) {
        setLoadingStat({ isDataLoading: loadingState.isDataLoading, isCompLoading: false });
      }
    });
  }, [matchUrl]);

  const props = { match, location, history, route };

  const LoadingComp = loading || DefaultLoadingComp;

  if (loadingState.isDataLoading || loadingState.isCompLoading) {
    return <LoadingComp {...props} match={match} location={location} />;
  }
  // @ts-ignore
  return routeElement as React.ReactElement;
}
