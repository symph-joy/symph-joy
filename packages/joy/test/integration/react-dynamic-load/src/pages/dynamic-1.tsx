import React, { ReactNode } from "react";
import { ReactController, BaseReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/dynamic-1" })
@ReactController()
export default class Dynamic1 extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">hello dynamic 1</div>;
  }
}
