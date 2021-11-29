import React from "react";
import { ReactController, BaseReactController, Route } from "../../../../index";

@Route({ path: "/hello" })
@ReactController()
export default class Hello extends BaseReactController {
  renderView() {
    return <div data-testid="hello">Hello</div>;
  }
}
