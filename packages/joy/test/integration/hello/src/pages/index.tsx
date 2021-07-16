import React, { ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";
import { IndexModel } from "./index.model";
import { Inject } from "@symph/core";

@Route({ path: "/" })
@Controller()
export default class HelloReactController extends ReactController {
  @Inject()
  indexModel: IndexModel;

  async initialModelStaticState(urlParams: any): Promise<void | number> {
    await this.indexModel.fetchMessage();
  }

  renderView(): ReactNode {
    return <div id="message">{this.indexModel.state.message}</div>;
  }
}
