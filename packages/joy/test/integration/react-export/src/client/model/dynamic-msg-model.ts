import { BaseReactModel, ReactModel } from "@symph/react";
import { Inject } from "@symph/core";
import { ReactFetchService } from "@symph/joy";

@ReactModel()
export class DynamicMsgModel extends BaseReactModel<{
  message: string;
}> {
  constructor() {
    super();
  }
  getInitState(): { message: string } {
    return { message: "" };
  }

  async fetchMessage(newMsg: string) {
    this.setState({
      message: newMsg,
    });
  }
}
