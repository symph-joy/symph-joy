import React, { ReactNode } from "react";
import { ReactController, ReactBaseController, Route, RouteSwitch } from "@symph/react";

@Route({ path: "/" })
@ReactController()
export default class HelloReactController extends ReactBaseController {
  renderView(): ReactNode {
    const { location, route } = this.props;
    return <RouteSwitch routes={(route as any).routes} />;
  }
}
