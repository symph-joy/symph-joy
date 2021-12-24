import React from "react";
import { Outlet } from "react-router-dom";
import { BaseReactController, ReactController, RouteContainer } from "../../../../../index";

@RouteContainer({ path: "/nest" })
@ReactController()
export default class NestLayout extends BaseReactController {
  renderView() {
    const { route, match } = this.props;
    return (
      <div>
        <h1 data-testid="nestLayout">Nest Layout</h1>
        <Outlet />
        {/*<RouteSwitch routes={route?.routes || []} extraProps={null} />*/}
      </div>
    );
  }
}
