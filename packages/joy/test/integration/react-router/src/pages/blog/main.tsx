import React from "react";
import { ReactBaseController, ReactController, RouteContainer, RouteSwitch } from "@symph/react";

@RouteContainer({ path: "/blog" })
@ReactController()
export default class Main extends ReactBaseController {
  renderView() {
    const { location, route } = this.props;
    return (
      <div>
        <h1 id="main">Blog Main Layout</h1>
        <RouteSwitch routes={route.routes} extraProps={null} />
      </div>
    );
  }
}
