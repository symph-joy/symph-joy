import React from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";

@Route({ path: "/blog/about" })
@ReactController()
export default class About extends ReactBaseController {
  renderView() {
    return <div id="about">Blog About</div>;
  }
}
