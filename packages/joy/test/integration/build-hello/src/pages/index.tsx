import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";

@Route({ path: "/" })
@ReactController()
export default class HelloController extends ReactBaseController {
  async hello() {
    return "a";
  }

  renderView(): ReactNode {
    return <div id="message">Welcome to Joy!</div>;
  }
}
