import React, { ComponentType, useContext, useEffect, useMemo, useState } from "react";
import { IReactRoute, JoyReactContext, JoyRouteInitState, MountModule, ReactAppInitManager } from "@symph/react";
import { ReactRouterClient } from "./react-router-client";
import * as H from "history";
import { match } from "react-router-dom";
import { DynamicLoading, Loader } from "../../joy-server/lib/dynamic";
import { RuntimeException } from "@symph/core";
import { isDynamicRoute } from "./router-utils";

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

export function JoyReactRouteLoader({ route, match, history, component, loading, extraProps, location }: JoyReactRouteLoaderOptions) {
  const { ssr, joyExport } = window.__JOY_DATA__;
  const { url: matchUrl } = match;
  const joyAppContext = useContext(JoyReactContext);
  if (!joyAppContext) {
    throw new Error("react app context is not initialed");
  }
  const { providerName, providerPackage, providerModule } = route;

  const LoadingComp =
    loading || (({ match, location, route }: { match: match; location: H.Location; route: IReactRoute }) => <div>{match.url} loading...</div>);

  let RouteComponent: ComponentType | Promise<ComponentType> = useMemo(() => {
    function wrapperComp(Comp: ComponentType) {
      // 当是叶子路由且是动态路由时，url地址发生后，新地址依然匹配当前路由时，界面重新加载。
      if (!route.routes?.length && isDynamicRoute(route.path)) {
        return (props: any) => {
          return <Comp {...props} />;
        };
      } else {
        return Comp;
      }
    }

    if (component) {
      const Comp = (component as any).default || component;
      return wrapperComp(Comp);
    } else if (typeof providerName !== "undefined") {
      const getComponent = (pModule: Record<string, unknown>) => {
        let info = joyAppContext.getProviderDefinition(providerName, providerPackage);
        if (info === undefined) {
          try {
            joyAppContext.registerModule(pModule);
          } catch (e) {
            console.log(e);
          }
        }
        // try get again
        info = joyAppContext.getProviderDefinition(providerName, providerPackage);
        if (!info) {
          throw new RuntimeException(`Joy can not find the route controller component(providerName:${String(providerName)})`);
        }
        const Comp = info.useClass as ComponentType;
        return wrapperComp(Comp);
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

    const ssgInfo = router.getSSGManifest(match.path);
    if (ssgInfo instanceof Promise) {
      return ssgInfo.then(check);
    } else {
      return check(ssgInfo);
    }
  }, [matchUrl]);

  const [loadingState, setLoadingStat] = useState({
    isDataLoading: false,
    isCompLoading: RouteComponent instanceof Promise,
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

    Promise.resolve(RouteComponent).then((Ctl) => {
      if (loadingState.isCompLoading) {
        setLoadingStat({ isDataLoading: loadingState.isDataLoading, isCompLoading: false });
      }
    });
  }, [matchUrl]);

  const props = { match, location, history, route };

  if (loadingState.isDataLoading || loadingState.isCompLoading) {
    return <LoadingComp {...props} />;
  }
  // @ts-ignore
  return <RouteComponent {...props} {...extraProps} route={route} />;
}
