import React, { useContext, useEffect, useMemo, useState } from "react";
import { ReactApplicationReactContext, ReactRouteInitStatus, ReactRouterService } from "@symph/react";
import * as H from "history";
import { useLocation } from "react-router-dom";
import { JoyReactAppInitManagerClient, JoySSGPage } from "../joy-react-app-init-manager-client";
import { ReactReduxService } from "@symph/react/dist/redux/react-redux.service";

const DefaultLoadingComp = ({ location }: { location: H.Location }) => <div>{location.pathname} ssg data loading...</div>;

export function JoyPageSSGDataLoader({ children }: { children: React.ReactNode }): any {
  const { ssr } = window.__JOY_DATA__;
  const location = useLocation();
  const pathname = location.pathname;

  const joyAppContext = useContext(ReactApplicationReactContext);

  if (!joyAppContext) {
    throw new Error("react app context is not initialed");
  }

  // prefetch Data
  const initManager = joyAppContext.getSync(JoyReactAppInitManagerClient);
  const reactRouter = joyAppContext.getSync(ReactRouterService);
  const ssgPage = useMemo(() => {
    if (!ssr) {
      return undefined;
    }
    let ssgInfo: Promise<JoySSGPage | undefined> | JoySSGPage | undefined = undefined;
    // 暂时只处理叶子路由。
    ssgInfo = initManager.getPageSSGState(pathname);
    const routesMatched = reactRouter.matchRoutes(pathname) || [];
    for (const routeMatch of routesMatched) {
      const initState = initManager.getRouteInitState(routeMatch.pathname);
      if (
        initState.initStatic === undefined ||
        initState.initStatic === ReactRouteInitStatus.NONE ||
        initState.initStatic === ReactRouteInitStatus.ERROR
      ) {
        initManager.setInitState(routeMatch.pathname, { initStatic: ReactRouteInitStatus.LOADING });
      }
    }

    return ssgInfo;
  }, [pathname]);

  const [loadingState, setLoadingStat] = useState({
    isDataLoading: ssgPage instanceof Promise,
  });

  // fetch page data
  useEffect(() => {
    Promise.resolve(ssgPage).then((ssgPage) => {
      if (!ssr) {
        return undefined;
      }
      const initState = initManager.getRouteInitState(location.pathname);
      if (initState?.initStatic !== ReactRouteInitStatus.SUCCESS && ssgPage?.ssgData?.length) {
        const reduxService = joyAppContext.getSync(ReactReduxService);
        reduxService.dispatchBatch(ssgPage.ssgData);
      }
      if (loadingState.isDataLoading) {
        setLoadingStat({ isDataLoading: false });
      }
    });
    return () => {};
  }, [pathname]);

  return children;
}
