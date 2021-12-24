import React from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/blog/about" })
@ReactController()
export default class About extends BaseReactController {
  renderView() {
    return <div id="about">Blog About</div>;
  }
}
