import React, { ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";
import { JoyBoot } from "@symph/joy";

@Route({ path: "/" })
@Controller()
export default class IndexController extends ReactController {
  renderView(): ReactNode {
    return <div id="message">${JoyBoot.name}</div>;
    // return <div id="message">aaaa</div>;
  }
}
