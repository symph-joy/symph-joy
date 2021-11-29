import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";
import { IndexModel } from "../model/index.model";
import { Autowire } from "@symph/core";

@Route({ path: "/" })
@ReactController()
export default class HelloReactController extends BaseReactController {
  @Autowire()
  indexModel: IndexModel;

  async initialModelStaticState(urlParams: any): Promise<void | number> {
    await this.indexModel.fetchMessage();
  }

  renderView(): ReactNode {
    return (
      <>
        <div>Main Module</div>
        <div>
          Message:<span id="message">{this.indexModel.state.message}</span>
        </div>
      </>
    );
  }
}
