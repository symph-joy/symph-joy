import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/" })
@ReactController()
export default class HelloController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div id="message">Welcome to Joy!</div>
      </>
    );
  }
}
