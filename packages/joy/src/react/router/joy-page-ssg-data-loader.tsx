import React, { useContext, useEffect, useMemo, useState } from "react";
import { ReactApplicationReactContext, ReactRouteInitStatus, ReactRouterService } from "@symph/react";
import * as H from "history";
import { useLocation } from "react-router-dom";
import { JoyReactAppInitManagerClient, JoySSGPage } from "../joy-react-app-init-manager-client";
import { ReactReduxService } from "@symph/react/dist/redux/react-redux.service";
import { AnyAction } from "@symph/react/dist/redux";

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
  const reduxService = joyAppContext.getSync(ReactReduxService);
  const ssgPage = useMemo(() => {
    if (!ssr) {
      return undefined;
    }
    let ssgPage: Promise<JoySSGPage | undefined> | JoySSGPage | undefined = undefined;

    ssgPage = initManager.getPageSSGState(pathname);
    if (ssgPage && !(ssgPage instanceof Promise)) {
      const routeSSGDataList = ssgPage.routeSSGDataList || [];
      routeSSGDataList.forEach((routeSSGData) => {
        if (routeSSGData.pathname.startsWith("INIT@")) {
          return;
        }
        const initState = initManager.getRouteInitState(routeSSGData);
        if (
          initState.initStatic === undefined ||
          initState.initStatic === ReactRouteInitStatus.NONE ||
          initState.initStatic === ReactRouteInitStatus.ERROR
        ) {
          if (routeSSGData.ssgData) {
            reduxService.dispatchBatch(routeSSGData.ssgData);
          } else {
            initManager.setInitState(routeSSGData, { initStatic: ReactRouteInitStatus.LOADING });
          }
        }
      });
    }
    return ssgPage;
  }, [pathname]);

  const [loadingState, setLoadingStat] = useState({
    isDataLoading: ssgPage instanceof Promise,
  });

  // fetch page data
  useEffect(() => {
    if (!ssr || !ssgPage) {
      return;
    }
    const reduxService = joyAppContext.getSync(ReactReduxService);
    const loadingPaths = [] as string[];
    (async () => {
      let ssgPageResolved;
      if (ssgPage instanceof Promise) {
        ssgPageResolved = await ssgPage;
      } else {
        ssgPageResolved = ssgPage;
      }
      if (!ssgPageResolved) {
        return;
      }

      if (ssgPageResolved.loadingTask) {
        await ssgPageResolved.loadingTask;
      }
      const routeSSGDataList = ssgPageResolved.routeSSGDataList || [];
      const actions = routeSSGDataList.reduce((pre: AnyAction[], routeSSGData) => {
        const initState = initManager.getRouteInitState(routeSSGData);
        if (initState.initStatic !== ReactRouteInitStatus.SUCCESS) {
          pre = pre.concat(routeSSGData.ssgData);
        }
        return pre;
      }, []);
      reduxService.dispatchBatch(actions);
    })();
  }, [pathname]);

  return children;
}
