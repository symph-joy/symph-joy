import React, { ReactNode } from "react";
import { ReactController, BaseReactController, Route } from "@symph/react";

@Route({ path: "/dynamic-1" })
@ReactController()
export default class Dynamic1 extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">hello dynamic 1</div>;
  }
}
