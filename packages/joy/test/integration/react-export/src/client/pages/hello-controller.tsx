import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/hello" })
@ReactController()
export default class HelloController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id="msg">Hello World!</div>
      </div>
    );
  }
}
