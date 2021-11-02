import React from "react";
import { IReactApplication, ReactRouter, RouteSwitch } from "@symph/react";

export default function App(props: { appContext: IReactApplication }) {
  const { appContext } = props;
  const reactRouter = appContext.syncTryGet<ReactRouter>("reactRouter");
  const routes = reactRouter?.getRoutes() || [];

  return <RouteSwitch routes={routes} extraProps={{}} />;
}
