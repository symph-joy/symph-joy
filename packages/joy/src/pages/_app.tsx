import React from "react";
import { IReactApplication, ReactRouterService } from "@symph/react";
import { RoutesRenderer } from "@symph/react/router-dom";

export type ReactAppProps = {
  appContext: IReactApplication;
};

export class App extends React.Component<ReactAppProps, any> {
  protected reactRouter: ReactRouterService;
  constructor(props: ReactAppProps, context?: any) {
    super(props, context);
    const appContext = props.appContext;
    this.reactRouter = appContext.getSync<ReactRouterService>("reactRouterService");
  }
  render() {
    const routes = this.reactRouter.getRoutes() || [];
    return <RoutesRenderer routes={routes} />;
  }
}

export default App;
