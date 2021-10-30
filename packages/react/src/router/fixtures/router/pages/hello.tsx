import React from "react";
import { ReactController, ReactBaseController, Route } from "../../../../index";

@Route({ path: "/hello" })
@ReactController()
export default class Hello extends ReactBaseController {
  renderView() {
    return <div data-testid="hello">Hello</div>;
  }
}
