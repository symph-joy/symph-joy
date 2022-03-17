import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";

@ReactController()
export default class ThirdModule extends BaseReactController {
  renderView(): ReactNode {
    return <h3 id="thirdMessage">Hello third module</h3>;
  }
}
