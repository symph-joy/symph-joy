import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { Autowire } from "@symph/core";

@Route({ path: "/" })
@ReactController()
export default class HelloReactController extends ReactBaseController {
  renderView(): ReactNode {
    return <div id="message">config</div>;
  }
}
