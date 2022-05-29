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
  element?: React.ReactElement;
  //
  // component: ComponentType | { default: ComponentType };
  //
  // providerName: string;
  // providerModule: Record<string, unknown> | (() => Promise<Record<string, unknown>>);
};

function isDynamicRoute(routePath: string): boolean {
  return routePath.indexOf(":") > 0 || routePath.indexOf("*") > 0;
}

const DefaultLoadingComp = ({ match, location, route }: { match: PathMatch; location: H.Location; route: IReactRoute }) => null;

function getRouteElement(appContext: IReactApplication, route: IReactRoute) {
  const { componentName, componentPackage, componentModule, element, path: routePath } = route;

  // function wrapperComp(Comp: ComponentType<any>) {
  //   let element = null;
  //   // url地址发生后，新地址依然匹配当前路由时，界面重新加载。
  //   if (isDynamicRoute(route.path)) {
  //     function InstComp(props: any) {
  //       return <Comp {...props} />;
  //     }
  //     // return <InstComp route={route} match={match} location={location} navigate={navigate} />;
  //     element = <InstComp />;
  //   } else {
  //     // return <Comp route={route} match={match} location={location} navigate={navigate} />;
  //     element = <Comp />;
  //   }
  //   return element;
  // }

  if (componentName !== undefined) {
    const routeElementResolver = createReactRouteResolver(routePath, componentName as string, componentPackage);

    const getComponent = (pModule: Record<string, unknown>) => {
      return routeElementResolver(appContext, pModule);
      // let info = appContext.getProviderDefinition(componentName, componentPackage);
      // if (info === undefined) {
      //   try {
      //     appContext.registerModule(pModule);
      //   } catch (e) {
      //     console.log(e);
      //   }
      //   // try get again
      //   info = appContext.getProviderDefinition(componentName, componentPackage);
      // }
      //
      // if (!info) {
      //   throw new RuntimeException(`Joy can not find the route controller component(providerName:${String(componentName)})`);
      // }
      // const Comp = info.useClass as ComponentType;
      // return wrapperComp(Comp);
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
        return wrapperComp(appContext, resolvedMod.default || resolvedMod, undefined, routePath);
      });
    } else {
      return wrapperComp(appContext, componentModule.default || componentModule, undefined, routePath);
    }
  } else if (element) {
    throw new RuntimeException(`React route "${route.path}" has element, should not be loaded by ReactRouteLoader, try to render element directly.`);
  } else {
    throw new RuntimeException(`React route loader can not load route "${route.path}".`);
  }
}

export function ReactRouteLoader({ route, element, loading }: ReactRouteLoaderOptions): React.ReactElement {
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

  const routeContextValue = useMemo(() => {
    const routeContextValue = {
      route,
      match,
      location,
      navigate,
      controllers: [],
    } as ReactRouteContextValue;
    return routeContextValue;
  }, [location, match]);

  let routeElement: React.ReactElement | Promise<React.ReactElement> = useMemo(() => {
    const children = element || getRouteElement(appContext, route);
    return children;
  }, [matchUrl]);

  const [loadingState, setLoadingStat] = useState({
    isCompLoading: routeElement instanceof Promise,
    routeElement: routeElement,
  });

  useEffect(() => {
    const initManager = appContext.getSync(ReactAppInitManager);
    Promise.all([routeElement, initManager.initControllers(matchUrl)]).then(([ele, ctl]) => {
      if (loadingState.isCompLoading) {
        setLoadingStat({ isCompLoading: false, routeElement: ele });
      }
    });
  }, [matchUrl]);

  const props = { match, location, route };

  const LoadingComp = loading || DefaultLoadingComp;

  if (loadingState.isCompLoading) {
    return <LoadingComp {...props} match={match} location={location} />;
  }

  return <ReactRouteContext.Provider value={routeContextValue}>{loadingState.routeElement}</ReactRouteContext.Provider>;
}

export function createReactRouteResolver(routePath: string, componentName: string, componentPackage: undefined | string) {
  return function (appContext: IReactApplication, objModule: Record<string, unknown>, props?: any): JSX.Element {
    let info = appContext.getProviderDefinition(componentName, componentPackage);
    if (info === undefined) {
      try {
        appContext.registerModule(objModule);
      } catch (e) {
        console.log(e);
      }
      // try get again
      info = appContext.getProviderDefinition(componentName, componentPackage);
    }

    if (!info) {
      throw new RuntimeException(`Joy can not find the route controller component(providerName:${String(componentName)})`);
    }
    const Comp = info.useClass as ComponentType;

    return <Comp {...props} />;
  };
}

function wrapperComp(appContext: IReactApplication, Comp: ComponentType<any>, props: any, routePath: string) {
  // let element = null;
  // // url地址发生后，新地址依然匹配当前路由时，界面重新加载。
  // if (isDynamicRoute(routePath)) {
  //   function InstComp(props: any) {
  //     return <Comp {...props} />;
  //   }
  //   element = <InstComp {...props} />;
  // } else {
  //   element = <Comp {...props} />;
  // }
  return <Comp {...props} />;
}
