import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";

@Route({ path: "/embed/view1" })
@ReactController()
export default class ThirdEmbedView1 extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div>Embed View</div>
        <div>
          Message:<span id="message">This is a embed view from third module.</span>
        </div>
      </>
    );
  }
}
