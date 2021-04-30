import React, { ReactNode } from "react";
import {
  Controller,
  Model,
  ReactController,
  ReactModel,
  Route,
} from "@symph/react";
import { Inject } from "@symph/core";
import { Prerender } from "@symph/joy/dist/build/prerender";

@Model()
export class StaticStateModel extends ReactModel<{ message: string }> {
  getInitState(): { message: string } {
    return {
      message: "hello from staticStateModel",
    };
  }

  async setMessage(newMessage: string): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setState({
          message: newMessage,
        });
        resolve();
      }, 1);
    });
  }
}

@Prerender()
@Route({ path: "/static-state" })
@Controller()
export default class StaticStateCtl extends ReactController {
  @Inject()
  public staticStateModel: StaticStateModel;

  async initialModelStaticState(urlParams: any): Promise<void> {
    await this.staticStateModel.setMessage(
      "hello from initialModelStaticState"
    );
  }

  renderView(): ReactNode {
    const { message } = this.staticStateModel.state;
    return (
      <>
        <div id="message">message</div>
      </>
    );
  }
}
