import React, { ReactNode } from "react";
import { ReactModel, BaseReactController, ReactController, BaseReactModel, ReactRoute } from "@symph/react";
import { Inject } from "@symph/core";
import { Prerender } from "@symph/joy/react";

@ReactModel()
export class RevalidateModel extends BaseReactModel<{
  msg: string;
  updateTime: number;
}> {
  getInitState(): {
    msg: string;
    updateTime: number;
  } {
    return {
      msg: "init",
      updateTime: 0,
    };
  }

  async setStaticMessage(newMessage: string): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setState({
          msg: newMessage,
          updateTime: new Date().getTime(),
        });
        resolve();
      }, 10);
    });
  }
}

@Prerender()
@ReactRoute({ path: "/revalidate" })
@ReactController()
export default class RevalidateCtl extends BaseReactController {
  @Inject()
  public revalidateModel: RevalidateModel;

  async initModelStaticState(): Promise<number> {
    await this.revalidateModel.setStaticMessage("hello from initialModelStaticState");
    return 1;
  }

  renderView(): ReactNode {
    const { msg, updateTime } = this.revalidateModel.state;
    return (
      <>
        <div id="msg">{msg}</div>
        <div id="updateTime">{updateTime}</div>
      </>
    );
  }
}
