import React, { useContext } from "react";
import { IReactApplication } from "./interfaces";
import { ReactRouterService } from "./router/react-router-service";
import { ReactApplicationReactContext } from "./react-app-container";
import { useRoutes } from "react-router";

// export type TReactAppComponentProps = {
//   // appContext: IReactApplication;
//   [key: string]: unknown;
// };

export type TReactAppComponent = React.ComponentType<{
  appContext: IReactApplication;
  [key: string]: unknown;
}>;

export default function ReactAppComponent() {
  const appContext = useContext(ReactApplicationReactContext);
  if (!appContext) {
    throw new Error("React App Context not found.");
  }
  const reactRouterService = appContext.getSync<ReactRouterService>("reactRouterService");
  const routes = reactRouterService.getRoutes() || [];
  return useRoutes(routes);
}
