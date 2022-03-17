import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/throw-err" })
@ReactController()
export default class ThrowErrController extends BaseReactController {
  state = {
    count: 1,
  };
  renderView(): ReactNode {
    throw new Error("Throw MyError");
    return (
      <div>
        count:<span>{this.state.count}</span>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>add 1</button>
      </div>
    );
  }
}
