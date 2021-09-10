import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { ThirdModel } from "../../model/thirdModel";
import { Autowire } from "@symph/core";

@Route({ path: "/third/embed/view1" })
@ReactController()
export default class EmbedView1 extends ReactBaseController {
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