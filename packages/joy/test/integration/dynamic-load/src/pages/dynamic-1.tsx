import React, { ReactNode } from "react";
import { ReactController, ReactBaseController, Route } from "@symph/react";

@Route({ path: "/dynamic-1" })
@ReactController()
export default class Dynamic1 extends ReactBaseController {
  renderView(): ReactNode {
    return <div id="message">hello dynamic 1</div>;
  }
}
