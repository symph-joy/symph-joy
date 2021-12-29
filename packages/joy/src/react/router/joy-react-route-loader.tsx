import React, { useContext, useEffect, useMemo, useState } from "react";
import { IReactRoute, ReactApplicationReactContext } from "@symph/react";
import * as H from "history";
import { PathMatch, useLocation, useMatch, useNavigate } from "react-router-dom";
import { DynamicLoading, Loader } from "../../joy-server/lib/dynamic";
import { RuntimeException } from "@symph/core";
import { getRouteElement } from "@symph/react/dist/router/react-route-loader";
import { IJoyReactRouteBuild } from "./joy-react-router-plugin";
import { JoyReactAppInitManagerClient } from "../joy-react-app-init-manager-client";
import { ReactReduxService } from "@symph/react/dist/redux/react-redux.service";

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
  const { pathname: matchPathname } = match;
  const joyAppContext = useContext(ReactApplicationReactContext);
  if (!joyAppContext) {
    throw new Error("react app context is not initialed");
  }
  if (route.catchAllParam) {
    // 特殊处理，填入catchAllParam的值。
    Object.defineProperty(match.params, route.catchAllParam, {
      value: match.params["*"],
    });
  }

  let routeElement: React.ReactElement | Promise<React.ReactElement> = useMemo(() => {
    return getRouteElement(joyAppContext, route, match, location, navigate);
  }, [matchPathname]);

  // prefetch Data
  const initManager = joyAppContext.getSync(JoyReactAppInitManagerClient);

  /**
   * 是否采用ssg数据的条件：
   * 1. 预渲染的静态路由页面，revalidate为false。
   * 2. 预渲染的动态路由页面，fallback为false，revalidate为false。
   */
  const ssgPage = useMemo(() => {
    if (!ssr) {
      return undefined;
    }
    const ssgInfo = initManager.getPageSSGState(match.pathname, match.pattern.path);
    return ssgInfo;
  }, [matchPathname]);

  const [loadingState, setLoadingStat] = useState({
    isDataLoading: ssgPage instanceof Promise,
    isCompLoading: routeElement instanceof Promise,
  });
  // fetch page data
  useEffect(() => {
    Promise.resolve(ssgPage).then((ssgPage) => {
      if (!ssr) {
        return undefined;
      }

      if (ssgPage?.ssgData?.length) {
        const reduxService = joyAppContext.getSync(ReactReduxService);
        reduxService.dispatchBatch(ssgPage.ssgData);
      }
      if (loadingState.isDataLoading) {
        setLoadingStat({ isDataLoading: false, isCompLoading: loadingState.isCompLoading });
      }
    });

    Promise.resolve(routeElement).then((Ctl) => {
      if (loadingState.isCompLoading) {
        setLoadingStat({ isDataLoading: loadingState.isDataLoading, isCompLoading: false });
      }
    });
    return () => {};
  }, [matchPathname]);

  const props = { match, location, history, route };

  const LoadingComp = loading || DefaultLoadingComp;
  if (loadingState.isDataLoading || loadingState.isCompLoading) {
    return <LoadingComp {...props} match={match} location={location} />;
  }
  // @ts-ignore
  return routeElement as React.ReactElement;
}
