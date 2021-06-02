import React, {
  ComponentType,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  IReactRoute,
  JoyReactContext,
  JoyRouteInitState,
  ReactAppInitManager,
} from "@symph/react";
import { ReactRouterClient } from "./react-router-client";
import * as H from "history";
import { match } from "react-router-dom";
import dynamic, { DynamicLoading, Loader } from "../joy-server/lib/dynamic";

type JoyReactRouteLoaderOptions = {
  match: match;
  location: H.Location;
  history: H.History;
  extraProps: Record<string, any>;
  route: IReactRoute;

  component: ComponentType | { default: ComponentType };
  loader?: Loader;
  loading?: DynamicLoading;
};

export function JoyReactRouteLoader({
  route,
  match,
  history,
  component,
  loader,
  loading,
  extraProps,
  location,
}: JoyReactRouteLoaderOptions) {
  const joyAppContext = useContext(JoyReactContext);
  if (!joyAppContext) {
    throw new Error("react app context is not initialed");
  }

  // const {providerId} = route
  // if(!providerId){
  //   throw new Error('joyReactRouteLoader: the route is not a ReactController')
  // }

  // @ts-ignore
  let RouteComponent = component.default || component;
  const LoadingComp = loading || (() => <div>route loading...</div>);

  // lazy component
  if (typeof loader !== "undefined") {
    RouteComponent = dynamic({ loader, loading });
  }

  // prefetch Data
  const router = joyAppContext.syncGetProvider(ReactRouterClient);
  const href = location.pathname;
  /**
   * 是否采用ssg数据的条件：
   * 1. 预渲染的静态路由页面，revalidate为false。
   * 2. 预渲染的动态路由页面，fallback为false，revalidate为false。
   */
  const isUseSSGData = useMemo(() => {
    const initManager = joyAppContext.syncGetProvider(ReactAppInitManager);
    const initState = initManager.getState(href);
    if (initState && initState.initStatic === JoyRouteInitState.SUCCESS) {
      return false;
    }
    const check = (ssgInfo: boolean) => {
      if (!ssgInfo) {
        return false;
      }
      // return initState && (initState.initStatic === JoyRouteInitState.NONE || initState.initStatic === JoyRouteInitState.ERROR);
      const isUse = true;
      if (isUse) {
        initManager.setInitState(href, {
          initStatic: JoyRouteInitState.LOADING,
        });
      }
      return isUse;
    };

    const ssgInfo = router.getSSGManifest(match.path);
    if (ssgInfo instanceof Promise) {
      return ssgInfo.then(check);
    } else {
      return check(ssgInfo);
    }
  }, []);

  const isWaitingCheckSSGData = isUseSSGData instanceof Promise;
  const [loadingState, setLoadingStat] = useState({
    isLoading: isWaitingCheckSSGData,
  });

  useEffect(() => {
    Promise.resolve(isUseSSGData).then((is) => {
      if (!is) {
        if (loadingState.isLoading) {
          setLoadingStat({ isLoading: false });
        }
        return;
      }
      const initManager = joyAppContext.syncGetProvider(ReactAppInitManager);

      router
        .fetchSSGData(href)
        .then((ssgData: Array<any>) => {
          // todo merge store state
          if (ssgData && ssgData.length) {
            for (const data of ssgData) {
              joyAppContext.dispatch(data);
            }
          }
          initManager.setInitState(href, {
            initStatic: JoyRouteInitState.SUCCESS,
          });
        })
        .catch((e) => {
          initManager.setInitState(href, {
            initStatic: JoyRouteInitState.ERROR,
          });
        });

      if (loadingState.isLoading) {
        setLoadingStat({ isLoading: false });
      }
    });
  }, [match]);

  const props = { match, location, history, route };

  if (loadingState.isLoading) {
    return <LoadingComp />;
  }
  return <RouteComponent {...props} {...extraProps} route={route} />;
}
