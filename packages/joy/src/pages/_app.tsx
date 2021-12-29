import React from "react";
import { IReactApplication, IReactRoute, ReactRouterService } from "@symph/react";
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

  public getRoutes(): IReactRoute[] {
    return this.reactRouter.getRoutes() || [];
  }

  render() {
    const routes = this.getRoutes();
    return <RoutesRenderer routes={routes} />;
  }
}

export default App;
