import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";

@Route({ path: "/hello" })
@ReactController()
export default class HelloController extends ReactBaseController {
  renderView(): ReactNode {
    return (
      <div>
        <div id="msg">Hello World!</div>
      </div>
    );
  }
}
