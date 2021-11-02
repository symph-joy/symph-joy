import { ReactBaseModel, ReactModel } from "@symph/react";

@ReactModel()
export class StaticStateModel extends ReactBaseModel<{
  staticMessage: string;
  dynamicMessage: string;
}> {
  getInitState(): { staticMessage: string; dynamicMessage: string } {
    return {
      staticMessage: "init static message",
      dynamicMessage: "init dynamic message",
    };
  }

  async setStaticMessage(newMessage: string): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setState({
          staticMessage: newMessage,
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
        });
        resolve();
      }, 10);
    });
  }
}
