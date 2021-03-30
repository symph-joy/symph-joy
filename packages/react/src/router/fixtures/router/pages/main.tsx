import React from "react";
import { Route } from "../../../react-route.decorator";
import { Controller } from "../../../../react-controller.decorator";
import { ReactController } from "../../../../react-controller";
import { RouteSwitch } from "../../../route-switch";

@Route({ path: "/" })
@Controller()
export default class Main extends ReactController {
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
