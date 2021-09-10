import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { ThirdModel } from "../model/thirdModel";
import { Autowire } from "@symph/core";

@Route({ path: "/third" })
@ReactController()
export default class HelloReactController extends ReactBaseController {
  @Autowire()
  thirdModel: ThirdModel;

  async initialModelStaticState(urlParams: any): Promise<void | number> {
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