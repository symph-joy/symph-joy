import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { JoyBoot } from "@symph/joy";

@ReactRoute({ path: "/" })
@ReactController()
export default class IndexController extends BaseReactController {
  renderView(): ReactNode {
    return <div id="message">${JoyBoot.name}</div>;
    // return <div id="message">aaaa</div>;
  }
}
