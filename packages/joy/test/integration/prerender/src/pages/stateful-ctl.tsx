import React, { ReactNode } from "react";
import { ReactModel, ReactBaseController, ReactController, ReactBaseModel, Route } from "@symph/react";
import { Autowire } from "@symph/core";
import { Prerender } from "@symph/joy/dist/build/prerender";

@ReactModel()
export class StatefulModel extends ReactBaseModel<{
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
@Route({ path: "/stateful" })
@ReactController()
export default class StatefulCtl extends ReactBaseController {
  @Autowire()
  public statefulModel: StatefulModel;

  async initialModelStaticState(urlParams: any): Promise<void> {
    await this.statefulModel.setStaticMessage("hello from initialModelStaticState");
  }

  async initialModelState(context: any): Promise<void> {
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
