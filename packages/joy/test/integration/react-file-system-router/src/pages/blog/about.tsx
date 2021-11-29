import React from "react";
import { BaseReactController, ReactController } from "@symph/react";

@ReactController()
export default class About extends BaseReactController {
  renderView() {
    return <div id="about">Blog About</div>;
  }
}
