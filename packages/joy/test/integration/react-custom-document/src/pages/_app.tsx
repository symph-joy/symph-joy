import React from "react";
import { App } from "@symph/joy/react";
import { RouteSwitch } from "@symph/react";

export default class MyApp extends App {
  render() {
    const routes = this.reactRouter.getRoutes();
    return (
      <div>
        <p id="hello-app">Hello App</p>
        <p id="hello-app-hmr">Hello App HMR</p>
        <RouteSwitch routes={routes} extraProps={{}} />
      </div>
    );
  }
}
