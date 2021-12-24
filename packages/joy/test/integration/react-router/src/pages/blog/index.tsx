import React from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/blog", index: true })
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
