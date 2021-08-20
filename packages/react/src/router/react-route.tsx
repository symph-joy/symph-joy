import React from "react";
import { Route, useLocation } from "react-router-dom";
import { useJoyContext } from "../hooks";
import { IReactRoute } from "../interfaces";
import * as H from "history";

export interface ReactRouteProps extends IReactRoute {
  location?: H.Location;
  extraProps?: any;
}

export function ReactRoute({ location, extraProps, ...route }: ReactRouteProps) {
  if (!location) {
    location = useLocation();
  }
  // todo 加载异步组件

  const joyContext = useJoyContext();
  const RouteComponent = route.component;
  return (
    <Route
      path={route.path}
      exact={route.exact}
      strict={route.strict}
      render={(props) => {
        if (route.render) {
          return route.render({ ...props, ...extraProps, route: route });
        } else if (RouteComponent) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return <RouteComponent {...props} {...extraProps} route={route} />;
        } else if (route.providerName) {
          const instanceWrapper = joyContext.getProviderDefinition(route.providerName);
          if (!instanceWrapper) {
            throw new Error(`Missing controller(id:${String(route.providerName)}) in the container`);
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return <instanceWrapper.type {...props} {...extraProps} route={route} />;
        } else {
          throw new Error(`Can not render the route(${route.path}), there is no property named 'render' or 'component' or 'providerName' used to render`);
        }
      }}
    />
  );
}
