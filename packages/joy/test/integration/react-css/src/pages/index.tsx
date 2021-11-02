import React, { ReactNode } from "react";
import { ReactBaseController, ReactController } from "@symph/react";

@ReactController()
export default class GlobalController extends ReactBaseController {
  renderView(): ReactNode {
    return (
      <div>
        <div id={"globalStyle"}>Global style</div>
      </div>
    );
  }
}
