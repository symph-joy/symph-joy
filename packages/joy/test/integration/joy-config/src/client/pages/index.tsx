import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { Inject } from "@symph/core";

@ReactRoute({ path: "/" })
@ReactController()
export default class HelloReactController extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">config</div>;
  }
}
