import React, { ReactNode } from "react";
import { ReactController, BaseReactController, ReactRoute, RouteSwitch, ReactRouteContainer } from "@symph/react";
import { Outlet } from "react-router-dom";

@ReactRouteContainer({ path: "/" })
@ReactController()
export default class HelloReactController extends BaseReactController {
  renderView(): ReactNode {
    const { location, route } = this.props;
    return <Outlet />;
    // return <RouteSwitch routes={(route as any).routes} />;
  }
}
