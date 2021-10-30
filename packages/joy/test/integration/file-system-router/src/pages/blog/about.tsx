import React from "react";
import { ReactBaseController, ReactController } from "@symph/react";

@ReactController()
export default class About extends ReactBaseController {
  renderView() {
    return <div id="about">Blog About</div>;
  }
}
