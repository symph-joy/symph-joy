import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";

@Route({ path: "/" })
@ReactController()
export default class HelloController extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">Welcome to Joy!</div>;
  }
}
