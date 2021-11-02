import React from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";

@Route({ path: "/blog/index" })
@ReactController()
export default class Index extends ReactBaseController {
  renderView() {
    return <div id="index">Blog Index</div>;
  }
}
