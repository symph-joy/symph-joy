import React from "react";
import { ReactController, BaseReactController, ReactRoute } from "../../../../index";

@ReactRoute({ path: "/hello" })
@ReactController()
export default class Hello extends BaseReactController {
  renderView() {
    return <div data-testid="hello">Hello</div>;
  }
}
