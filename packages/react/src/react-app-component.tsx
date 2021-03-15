import React from "react";
import { IReactApplication } from "./interfaces";
import { ReactRouter } from "./router/react-router";
import { RouteSwitch } from "./router/route-switch";

export type TReactAppComponentProps = {
  appContext: IReactApplication;
  [key: string]: unknown;
};

export type TReactAppComponent = React.ComponentType<{
  appContext: IReactApplication;
  [key: string]: unknown;
}>;

export default function ReactAppComponent({
  appContext,
}: TReactAppComponentProps) {
  const reactRouter = appContext.syncGetProvider<ReactRouter>("reactRouter", {
    optional: true,
  });
  const routes = reactRouter?.getRoutes() || [];

  return (
    <>
      <h1>ReactAppComponent</h1>
      <RouteSwitch routes={routes} extraProps={{}} />
    </>
  );
}
