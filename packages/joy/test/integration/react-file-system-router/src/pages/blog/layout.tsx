import React from "react";
import { BaseReactController, ReactController, RouteSwitch } from "@symph/react";
import { Outlet } from "react-router-dom";

@ReactController()
export default class Layout extends BaseReactController {
  renderView() {
    const { location, route } = this.props;
    return (
      <div>
        <h1 id="layout">Blog Main Layout</h1>
        <Outlet />
        {/*<RouteSwitch routes={route.routes} extraProps={null} />*/}
      </div>
    );
  }
}
