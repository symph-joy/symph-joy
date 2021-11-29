import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";
import { JoyBoot } from "@symph/joy";

@Route({ path: "/" })
@ReactController()
export default class IndexController extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">${JoyBoot.name}</div>;
    // return <div id="message">aaaa</div>;
  }
}
