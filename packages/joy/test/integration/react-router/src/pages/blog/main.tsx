import React from "react";
import { BaseReactController, ReactController, RouteContainer } from "@symph/react";
import { Outlet } from "react-router-dom";

@RouteContainer({ path: "/blog" })
@ReactController()
export default class Main extends BaseReactController {
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
