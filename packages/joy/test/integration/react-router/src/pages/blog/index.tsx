import React from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";

@Route({ path: "/blog", index: true })
@ReactController()
export default class Index extends BaseReactController {
  renderView() {
    return (
      <div id="index" data-testid="aaa">
        Blog Index
      </div>
    );
  }
}
