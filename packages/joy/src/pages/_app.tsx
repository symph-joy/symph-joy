import React from "react";
import { IReactApplication, ReactRouter, RouteSwitch } from "@symph/react";

export type ReactAppProps = {
  appContext: IReactApplication;
};

export class App extends React.Component<ReactAppProps, any> {
  protected reactRouter: ReactRouter;
  constructor(props: ReactAppProps, context?: any) {
    super(props, context);
    const appContext = props.appContext;
    this.reactRouter = appContext.getSync<ReactRouter>("reactRouter");
  }
  render() {
    const routes = this.reactRouter.getRoutes() || [];
    return <RouteSwitch routes={routes} extraProps={{}} />;
  }
}

export default App;
