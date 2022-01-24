import React, { ComponentType, useContext, useEffect, useMemo, useState } from "react";
import * as H from "history";
import { NavigateFunction, PathMatch, useLocation, useMatch, useNavigate } from "react-router";
import { RuntimeException } from "@symph/core";
import { ReactApplicationReactContext } from "../react-app-container";
import { IReactApplication, IReactRoute } from "../interfaces";
import { ReactRouteContext, ReactRouteContextValue } from "./react-route.decorator";
import { ReactAppInitManager } from "../react-app-init-manager";

type ReactRouteLoaderOptions = {
  // match: PathMatch;
  // location: H.Location;
  // history: H.History;
  // extraProps: Record<string, any>;
  route: IReactRoute;
  loading?: any;
  //
  // component: ComponentType | { default: ComponentType };
  //
  // providerName: string;
  // providerModule: Record<string, unknown> | (() => Promise<Record<string, unknown>>);
};

function isDynamicRoute(routePath: string): boolean {
  return routePath.indexOf(":") > 0 || routePath.indexOf("*") > 0;
}

const DefaultLoadingComp = ({ match, location, route }: { match: PathMatch; location: H.Location; route: IReactRoute }) => (
  <div>{match.pathname} loading...</div>
);

export function getRouteElement(
  appContext: IReactApplication,
  route: IReactRoute,
  match: PathMatch,
  location: H.Location,
  navigate: NavigateFunction
) {
  const { componentName, componentPackage, componentModule, element } = route;

  function wrapperComp(Comp: ComponentType<any>) {
    let element = null;
    // url地址发生后，新地址依然匹配当前路由时，界面重新加载。
    if (isDynamicRoute(route.path)) {
      function InstComp(props: any) {
        return <Comp {...props} />;
      }
      // return <InstComp route={route} match={match} location={location} navigate={navigate} />;
      element = <InstComp />;
    } else {
      // return <Comp route={route} match={match} location={location} navigate={navigate} />;
      element = <Comp />;
    }

    const routeContextValue = {
      route,
      match,
      location,
      navigate,
      controllers: [],
    } as ReactRouteContextValue;
    return <ReactRouteContext.Provider value={routeContextValue}>{element}</ReactRouteContext.Provider>;
  }

  if (typeof componentName !== "undefined") {
    const getComponent = (pModule: Record<string, unknown>) => {
      let info = appContext.getProviderDefinition(componentName, componentPackage);
      if (info === undefined) {
        try {
          appContext.registerModule(pModule);
        } catch (e) {
          console.log(e);
        }
      }
      // try get again
      info = appContext.getProviderDefinition(componentName, componentPackage);
      if (!info) {
        throw new RuntimeException(`Joy can not find the route controller component(providerName:${String(componentName)})`);
      }
      const Comp = info.useClass as ComponentType;
      return wrapperComp(Comp);
    };
    if (typeof componentModule === "function") {
      // dynamic lazy load
      return componentModule().then((module: any) => {
        return getComponent(module);
      });
    } else {
      return getComponent(componentModule as any);
    }
  } else if (componentModule) {
    if (typeof componentModule === "function") {
      return componentModule().then((resolvedMod: any) => {
        return wrapperComp(resolvedMod.default || resolvedMod);
      });
    } else {
      return wrapperComp(componentModule.default || componentModule);
    }
  } else if (element) {
    throw new RuntimeException(`React route "${route.path}" has element, should not be loaded by ReactRouteLoader, try to render element directly.`);
  } else {
    throw new RuntimeException(`React route loader can not load route "${route.path}".`);
  }
}

export function ReactRouteLoader({ route, loading }: ReactRouteLoaderOptions): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const match = useMatch({ path: route.path, end: !route.children?.length });
  if (!match) {
    throw new RuntimeException(`React route load error: Route "${route.path}" is not match location: "${location.pathname}"`);
  }
  const { pathname: matchUrl } = match;
  const appContext = useContext(ReactApplicationReactContext);
  if (!appContext) {
    throw new Error("react app context is not initialed");
  }
  if (route.catchAllParam) {
    // 特殊处理，填入catchAllParam的值。
    Object.defineProperty(match.params, route.catchAllParam, {
      value: match.params["*"],
    });
  }

  let routeElement: React.ReactElement | Promise<React.ReactElement> = useMemo(() => {
    return getRouteElement(appContext, route, match, location, navigate);
  }, [matchUrl]);

  const [loadingState, setLoadingStat] = useState({
    isCompLoading: routeElement instanceof Promise,
  });

  useEffect(() => {
    const initManager = appContext.getSync(ReactAppInitManager);
    Promise.resolve(initManager.initControllers(matchUrl)).then((Ctl) => {
      if (loadingState.isCompLoading) {
        setLoadingStat({ isCompLoading: false });
      }
    });
  }, [matchUrl]);

  const props = { match, location, route };

  const LoadingComp = loading || DefaultLoadingComp;

  if (loadingState.isCompLoading) {
    return <LoadingComp {...props} match={match} location={location} />;
  }

  return routeElement as React.ReactElement;
}
