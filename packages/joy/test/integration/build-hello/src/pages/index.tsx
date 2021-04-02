import React, { ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";

@Route({ path: "/" })
@Controller()
export default class HelloController extends ReactController {
  async hello() {
    return "a";
  }

  renderView(): ReactNode {
    return <div id="message">Welcome to Joy!</div>;
  }
}
