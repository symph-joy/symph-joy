import React from "react";
import { BaseReactController, ReactController } from "@symph/react";

@ReactController()
export default class Index extends BaseReactController {
  renderView() {
    return <div id="index">Blog Index</div>;
  }
}
