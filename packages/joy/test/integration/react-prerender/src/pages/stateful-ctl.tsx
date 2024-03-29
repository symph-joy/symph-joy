import React, { ReactNode } from "react";
import { ReactModel, BaseReactController, ReactController, BaseReactModel, ReactRoute } from "@symph/react";
import { Inject } from "@symph/core";
import { Prerender } from "@symph/joy/react";

@ReactModel()
export class StatefulModel extends BaseReactModel<{
  staticMessage: string;
  staticUpdateTime: number;
  dynamicMessage: string;
  dynamicUpdateTime: number;
}> {
  getInitState(): {
    staticMessage: string;
    staticUpdateTime: 0;
    dynamicMessage: string;
    dynamicUpdateTime: number;
  } {
    return {
      staticMessage: "init static message",
      staticUpdateTime: 0,
      dynamicMessage: "init dynamic message",
      dynamicUpdateTime: 0,
    };
  }

  async setStaticMessage(newMessage: string): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setState({
          staticMessage: newMessage,
          staticUpdateTime: new Date().getTime(),
        });
        resolve();
      }, 10);
    });
  }

  async setDynamicMessage(newMessage: string): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setState({
          dynamicMessage: newMessage,
          dynamicUpdateTime: new Date().getTime(),
        });
        resolve();
      }, 10);
    });
  }
}

@Prerender()
@ReactRoute({ path: "/stateful" })
@ReactController()
export default class StatefulCtl extends BaseReactController {
  @Inject()
  public statefulModel: StatefulModel;

  async initModelStaticState(): Promise<void> {
    console.log("StatefulCtl: run initialModelStaticState");
    await this.statefulModel.setStaticMessage("hello from initialModelStaticState");
  }

  async initModelState(): Promise<void> {
    console.log("StatefulCtl: run initialModelState");
    await this.statefulModel.setDynamicMessage("hello from initialModelState");
  }

  renderView(): ReactNode {
    const { staticMessage, staticUpdateTime, dynamicUpdateTime, dynamicMessage } = this.statefulModel.state;
    return (
      <>
        <div id="staticMessage">{staticMessage}</div>
        <div id="staticUpdateTime">{staticUpdateTime}</div>

        <div id="dynamicMessage">{dynamicMessage}</div>
        <div id="dynamicUpdateTime">{dynamicUpdateTime}</div>
      </>
    );
  }
}
