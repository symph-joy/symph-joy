import React, { useContext } from "react";
import { IReactApplication } from "./interfaces";
import { ReactRouter } from "./router/react-router";
import { RouteSwitch } from "./router/route-switch";
import { JoyReactContext } from "./react-app-container";

// export type TReactAppComponentProps = {
//   // appContext: IReactApplication;
//   [key: string]: unknown;
// };

export type TReactAppComponent = React.ComponentType<{
  appContext: IReactApplication;
  [key: string]: unknown;
}>;

export default function ReactAppComponent() {
  const appContext = useContext(JoyReactContext);
  if (!appContext) {
    throw new Error("React App Context not found.");
  }
  const reactRouter = appContext.syncGet<ReactRouter>("reactRouter");
  const routes = reactRouter.getRoutes() || [];

  return <RouteSwitch routes={routes} extraProps={{}} />;
}
