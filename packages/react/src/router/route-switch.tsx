import React from "react";
import { Route, Switch, SwitchProps, useLocation } from "react-router-dom";
import { useJoyContext } from "../hooks";
import { IReactRoute } from "../interfaces";

interface RouterContainerType extends SwitchProps {
  routes: IReactRoute[];
  extraProps?: any;
}

export function RouteSwitch({ routes, location, extraProps }: RouterContainerType) {
  if (!location) {
    location = useLocation();
  }
  const joyContext = useJoyContext();
  return (
    <Switch location={location}>
      {(routes || []).map((route, i) => {
        const RouteComponent = route.component;
        let path: string | string[] = route.path;
        const isIndexPath = path.endsWith("/index");
        if (isIndexPath) {
          path = [route.path, path.slice(0, -6)];
        }
        return (
          <Route
            key={typeof route.providerName === "string" ? route.providerName : i}
            path={path}
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
                let instanceWrapper = joyContext.getProviderDefinition(route.providerName);
                if (!instanceWrapper && route.providerModule) {
                  joyContext.registerModule(route.providerModule);
                  instanceWrapper = joyContext.getProviderDefinition(route.providerName);
                }
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
      })}
    </Switch>
  );
}
