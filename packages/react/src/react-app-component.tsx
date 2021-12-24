import React, { useContext } from "react";
import { IReactApplication } from "./interfaces";
import { ReactRouter } from "./router/react-router";
import { ReactApplicationReactContext } from "./react-app-container";
import { useRoutes } from "react-router-dom";

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
  const reactRouter = appContext.getSync<ReactRouter>("reactRouter");
  const routes = reactRouter.getRoutes() || [];
  return useRoutes(routes);
  // return <RouteSwitch routes={routes} extraProps={{}} />;
}
