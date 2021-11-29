import React from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";

@Route({ path: "/blog/index" })
@ReactController()
export default class Index extends BaseReactController {
  renderView() {
    return <div id="index">Blog Index</div>;
  }
}
