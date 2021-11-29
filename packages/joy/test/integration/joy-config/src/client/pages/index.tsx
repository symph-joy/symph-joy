import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";
import { Autowire } from "@symph/core";

@Route({ path: "/" })
@ReactController()
export default class HelloReactController extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">config</div>;
  }
}
