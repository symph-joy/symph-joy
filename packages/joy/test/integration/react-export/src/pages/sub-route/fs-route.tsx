import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/react";

@Prerender()
@ReactController()
export default class FsRouteController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id="msg">hello fs route</div>
      </div>
    );
  }
}
