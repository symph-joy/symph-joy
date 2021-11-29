import React from "react";
import { ReactController, BaseReactController, Route, RouteContainer, RouteSwitch } from "../../../../../index";

@RouteContainer({ path: "/nest" })
@ReactController()
export default class NestLayout extends BaseReactController {
  renderView() {
    const { route, match } = this.props;
    return (
      <div>
        <h1 data-testid="nestLayout">Nest Layout</h1>
        <RouteSwitch routes={route?.routes || []} extraProps={null} />
      </div>
    );
  }
}
