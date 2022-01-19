import React, { ReactNode } from "react";
import { ReactModel, BaseReactController, ReactController, BaseReactModel, ReactRoute, ReactRouteContainer } from "@symph/react";
import { Inject } from "@symph/core";
import { Outlet } from "@symph/react/router-dom";

@ReactModel()
export class EmbedParentModel extends BaseReactModel<{
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

@ReactRouteContainer({ path: "/embed/parent" })
@ReactController()
export default class EmbedParentCtl extends BaseReactController {
  @Inject()
  public embedParentModel: EmbedParentModel;

  async initialModelStaticState(): Promise<void> {
    console.log("EmbedParentCtl: run initialModelStaticState");
    await this.embedParentModel.setMessage("hello from parent initialModelStaticState");
  }

  async initialModelState(context: any): Promise<void> {
    console.log("EmbedParentCtl: run initialModelState");
    await this.embedParentModel.setMessage("hello from parent initialModelState");
  }

  renderView(): ReactNode {
    const { msg } = this.embedParentModel.state;
    return (
      <>
        <div id="parentMsg">{msg}</div>
        <Outlet />
      </>
    );
  }
}
