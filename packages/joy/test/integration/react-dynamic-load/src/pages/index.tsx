import React, { ReactNode } from "react";
import { ReactController, BaseReactController, Route, RouteSwitch } from "@symph/react";

@Route({ path: "/" })
@ReactController()
export default class HelloReactController extends BaseReactController {
  renderView(): ReactNode {
    const { location, route } = this.props;
    return <RouteSwitch routes={(route as any).routes} />;
  }
}
