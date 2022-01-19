import React, { ReactNode } from "react";
import { ReactModel, BaseReactController, ReactController, BaseReactModel, ReactRoute } from "@symph/react";
import { Inject } from "@symph/core";
import { Prerender } from "@symph/joy/react";

@ReactModel()
export class EmbedChildModel extends BaseReactModel<{
  msg: string;
}> {
  getInitState(): {
    msg: string;
  } {
    return {
      msg: "init parent message",
    };
  }

  setMessage(msg: string) {
    this.setState({
      msg,
    });
  }
}

@Prerender()
@ReactRoute({ path: "/embed/parent/child" })
@ReactController()
export default class EmbedChildCtl extends BaseReactController {
  @Inject()
  public embedChildModel: EmbedChildModel;

  async initialModelStaticState(): Promise<void> {
    console.log("EmbedParentCtl: run initialModelStaticState");
    await this.embedChildModel.setMessage("hello from child initialModelStaticState");
  }

  async initialModelState(context: any): Promise<void> {
    console.log("EmbedParentCtl: run initialModelState");
    await this.embedChildModel.setMessage("hello from child initialModelState");
  }

  renderView(): ReactNode {
    const { msg } = this.embedChildModel.state;
    return (
      <>
        <div id="childMsg">{msg}</div>
      </>
    );
  }
}
