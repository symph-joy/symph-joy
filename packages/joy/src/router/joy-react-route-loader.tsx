import React, { ComponentType, useContext, useEffect, useState } from "react";
import {
  IReactRoute,
  JoyReactContext,
  ReactRoute,
  ReactRouteProps,
} from "@symph/react";
import { ReactRouterClient } from "./react-router-client";
import * as H from "history";
import { match } from "react-router-dom";
import path from "path";
import { Simulate } from "react-dom/test-utils";
import load = Simulate.load;
import dynamic, { Loader, DynamicLoading } from "../next-server/lib/dynamic";

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

  const [loadingState, setLoadingStat] = useState({ loading: false });

  // const {providerId} = route
  // if(!providerId){
  //   throw new Error('joyReactRouteLoader: the route is not a ReactController')
  // }

  // @ts-ignore
  let RouteComponent = component.default || component;

  if (typeof window !== "undefined") {
    // lazy component
    if (typeof loader !== "undefined") {
      RouteComponent = dynamic({ loader, loading });
    }

    // prefetch Data
    const router = joyAppContext.syncGetProvider(ReactRouterClient);
    const href = location.pathname;
    useEffect(() => {
      const ssgInfo = router.getSSGManifest(match.path);
      if (ssgInfo) {
        router
          .fetchSSGData(href)
          .then((ssgData: any) => {})
          .catch((e) => {});
      }
    }, [match]);
  } else {
  }
  const props = { match, location, history, route };
  return <RouteComponent {...props} {...extraProps} route={route} />;

  // const instanceWrapper = joyAppContext.getProviderDefinition(providerId);
  // if (!instanceWrapper) {
  //   throw new Error(`Missing controller(id:${providerId}) in the container`);
  // }

  // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // // @ts-ignore
  // return (
  //   <instanceWrapper.type
  //     {...props}
  //     {...extraProps}
  //   />
  // );
}
