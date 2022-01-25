import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { ThirdModel } from "../model/third-model";
import { Inject } from "@symph/core";

@ReactRoute({ path: "/" })
@ReactController()
export default class ThirdHelloReactController extends BaseReactController {
  @Inject()
  thirdModel: ThirdModel;

  async initModelStaticState(): Promise<void | number> {
    await this.thirdModel.fetchMessage();
  }

  renderView(): ReactNode {
    return (
      <>
        <div>Third Module</div>
        <div>
          Message:<span id="message">{this.thirdModel.state.message}</span>
        </div>
      </>
    );
    // return <div id="message">aaaaa</div>;
  }
}
