import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";

@ReactController()
export default class HelloController extends ReactBaseController {
  renderView(): ReactNode {
    return <div id="message">Welcome to Joy!</div>;
  }
}
