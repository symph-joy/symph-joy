// src/client/pages/index.tsx

import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { HelloModel } from "../model/hello.model";
import { Inject } from "@symph/core";

@ReactController()
export default class IndexController extends BaseReactController {
  @Inject()
  helloModel: HelloModel;

  renderView(): ReactNode {
    const { message } = this.helloModel.state;
    return (
      <div>
        <div id="message">{message}</div>
        <button id="btnUpdateMessage" onClick={() => this.helloModel.fetchMessage()}>
          Update Message
        </button>
      </div>
    );
  }
}
