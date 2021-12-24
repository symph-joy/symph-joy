import React from "react";
import { App } from "@symph/joy/react";
import { RoutesRenderer } from "@symph/react/router-dom";

export default class MyApp extends App {
  render() {
    const routes = this.reactRouter.getRoutes();
    return (
      <div>
        <p id="hello-app">Hello App</p>
        <p id="hello-app-hmr">Hello App HMR</p>
        <RoutesRenderer routes={routes} />
        {/*<RouteSwitch routes={routes} extraProps={{}} />*/}
      </div>
    );
  }
}
