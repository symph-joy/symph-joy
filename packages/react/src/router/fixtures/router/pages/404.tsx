import React from "react";
import { ReactController, BaseReactController, ReactRoute } from "../../../../index";

@ReactRoute({ path: "/404" })
@ReactController()
export default class Hello extends BaseReactController {
  renderView() {
    return <div data-testid="error">404</div>;
  }
}
