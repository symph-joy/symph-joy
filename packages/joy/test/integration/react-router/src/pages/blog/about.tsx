import React from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";

@Route({ path: "/blog/about" })
@ReactController()
export default class About extends BaseReactController {
  renderView() {
    return <div id="about">Blog About</div>;
  }
}
