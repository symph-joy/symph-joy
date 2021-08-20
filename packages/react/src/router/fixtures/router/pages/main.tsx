import React from "react";
import { Route } from "../../../react-route.decorator";
import { ReactController } from "../../../../react-controller.decorator";
import { ReactBaseController } from "../../../../react-base-controller";
import { RouteSwitch } from "../../../route-switch";

@Route({ path: "/" })
@ReactController()
export default class Main extends ReactBaseController {
  renderView() {
    const { location, route } = this.props;
    return (
      <div>
        <h1 data-testid="main">main</h1>
        <RouteSwitch routes={(route as any).routes} extraProps={null} />
      </div>
    );
  }
}
