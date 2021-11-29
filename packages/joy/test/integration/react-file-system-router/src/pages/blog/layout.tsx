import React from "react";
import { BaseReactController, ReactController, RouteSwitch } from "@symph/react";

@ReactController()
export default class Layout extends BaseReactController {
  renderView() {
    const { location, route } = this.props;
    return (
      <div>
        <h1 id="layout">Blog Main Layout</h1>
        <RouteSwitch routes={route.routes} extraProps={null} />
      </div>
    );
  }
}
