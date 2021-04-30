import { Model, ReactModel } from "@symph/react";

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
      }, 10);
    });
  }
}
