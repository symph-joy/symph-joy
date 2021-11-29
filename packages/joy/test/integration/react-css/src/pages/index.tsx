import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";

@ReactController()
export default class GlobalController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id={"globalStyle"}>Global style</div>
      </div>
    );
  }
}
