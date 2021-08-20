import React, { ComponentType, useContext, useEffect, useMemo, useState } from "react";
import { IReactRoute, JoyReactContext, JoyRouteInitState, ReactAppInitManager } from "@symph/react";
import { ReactRouterClient } from "./react-router-client";
import * as H from "history";
import { match } from "react-router-dom";
import dynamic, { DynamicLoading, Loader } from "../../joy-server/lib/dynamic";
import { RuntimeException } from "@symph/core";
import { rethrow } from "@symph/server/dist/helpers/rethrow";

type JoyReactRouteLoaderOptions = {
  match: match;
  location: H.Location;
  history: H.History;
  extraProps: Record<string, any>;
  route: IReactRoute;

  component: ComponentType | { default: ComponentType };
  loader?: Loader;
  loading?: DynamicLoading;

  providerName: string;
  providerModule: Record<string, unknown> | (() => Promise<Record<string, unknown>>);
};

export function JoyReactRouteLoader({
  route,
  match,
  history,
  component,
  // providerName,
  // providerModule,
  loading,
  extraProps,
  location,
}: JoyReactRouteLoaderOptions) {
  const joyAppContext = useContext(JoyReactContext);
  if (!joyAppContext) {
    throw new Error("react app context is not initialed");
  }
  const { providerName, providerModule } = route;

  // @ts-ignore

  const LoadingComp = loading || (() => <div>route loading...</div>);

  // // lazy component
  // if (component) {
  //   RouteComponent = (component as any).default || component;
  // } else {
  //   throw new RuntimeException('Joy react route loader can not get content component.')
  // }

  let RouteComponent: ComponentType | Promise<ComponentType> = useMemo(() => {
    if (component) {
      return (component as any).default || component;
    } else if (typeof providerName !== "undefined") {
      const getComponent = (pModule: Record<string, unknown>) => {
        let info = joyAppContext.getProviderDefinition(providerName);
        if (info === undefined) {
          joyAppContext.registerModule(pModule);
        }
        // try get again
        info = joyAppContext.getProviderDefinition(providerName);
        if (!info) {
          throw new RuntimeException(`Joy can not find the route controller component(providerName:${String(providerName)})`);
        }
        return info.useClass;
      };
      if (typeof providerModule === "function") {
        // dynamic lazy load
        return providerModule().then((module: any) => {
          return getComponent(module);
        });
      } else {
        return getComponent(providerModule as any);
      }
    } else {
      throw new RuntimeException("Joy react route loader can not get content component.");
    }
  }, [providerName, providerModule]);

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
    isDataLoading: isWaitingCheckSSGData,
    isCompLoading: RouteComponent instanceof Promise,
  });

  // fetch page data
  useEffect(() => {
    Promise.resolve(isUseSSGData).then((is) => {
      if (!is) {
        if (loadingState.isDataLoading) {
          setLoadingStat({ isDataLoading: false, isCompLoading: loadingState.isCompLoading });
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

      if (loadingState.isDataLoading) {
        setLoadingStat({ isDataLoading: false, isCompLoading: loadingState.isCompLoading });
      }
    });

    if (RouteComponent instanceof Promise) {
      RouteComponent.then((ctl) => {
        RouteComponent = ctl;
        setLoadingStat({ isDataLoading: loadingState.isDataLoading, isCompLoading: false });
      });
    }
  }, [match]);

  const props = { match, location, history, route };

  if (loadingState.isDataLoading || loadingState.isCompLoading) {
    return <LoadingComp />;
  }
  // @ts-ignore
  return <RouteComponent {...props} {...extraProps} route={route} />;
}
