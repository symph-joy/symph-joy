import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { IndexModel } from "../model/index.model";
import { Inject } from "@symph/core";

@Route({ path: "/" })
@ReactController()
export default class HelloReactController extends ReactBaseController {
  @Inject()
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
