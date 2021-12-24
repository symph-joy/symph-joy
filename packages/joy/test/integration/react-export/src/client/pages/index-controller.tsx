import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/react";

@Prerender()
@Route({ path: "/" })
@ReactController()
export default class IndexController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id="msg">Hello Index!</div>
        <div>
          link to: <a onClick={() => this.props.navigate("/hello")}>/hello</a>
        </div>
      </div>
    );
  }
}
