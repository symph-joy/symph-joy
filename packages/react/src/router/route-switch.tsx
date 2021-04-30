import React, { Component, useContext } from "react";
import {
  Route,
  Switch,
  SwitchProps,
  useLocation,
  RouteProps,
} from "react-router-dom";
import { useJoyContext } from "../hooks";
import { IReactRoute } from "../interfaces";

interface RouterContainerType extends SwitchProps {
  routes: IReactRoute[];
  extraProps?: any;
}

export function RouteSwitch({
  routes,
  location,
  extraProps,
}: RouterContainerType) {
  if (!location) {
    location = useLocation();
  }

  const joyContext = useJoyContext();

  return (
    <Switch location={location}>
      {(routes || []).map((route, i) => {
        const RouteComponent = route.component;
        return (
          <Route
            key={route.providerId || i}
            path={route.path}
            exact={route.exact}
            strict={route.strict}
            render={(props) => {
              if (route.render) {
                return route.render({ ...props, ...extraProps, route: route });
              } else if (RouteComponent) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return (
                  <RouteComponent {...props} {...extraProps} route={route} />
                );
              } else if (route.providerId) {
                const instanceWrapper = joyContext.getProviderDefinition(
                  route.providerId
                );
                if (!instanceWrapper) {
                  throw new Error(
                    `Missing controller(id:${route.providerId}) in the container`
                  );
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return (
                  <instanceWrapper.type
                    {...props}
                    {...extraProps}
                    route={route}
                  />
                );
              } else {
                throw new Error(
                  `Can not render the route(${route.path}), there is no property named 'render' or 'component' or 'providerId' used to render`
                );
              }
            }}
          />
        );
      })}
    </Switch>
  );
}
