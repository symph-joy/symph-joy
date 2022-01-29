import React from "react";
import { BaseReactController, ReactController, ReactRouteContainer } from "@symph/react";
import { Outlet } from "react-router-dom";

@ReactRouteContainer({ path: "/blog" })
@ReactController()
export default class Layout extends BaseReactController {
  renderView() {
    const { location, route } = this.props;
    return (
      <>
        <h1 id="main">Blog Main Layout</h1>
        <Outlet />
        {/*<RouteSwitch routes={route.routes} extraProps={null} />*/}
      </>
    );
  }
}
