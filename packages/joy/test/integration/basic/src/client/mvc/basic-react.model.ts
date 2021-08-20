import { ReactBaseModel, ReactModel } from "@symph/react";

@ReactModel()
export class BasicReactModel extends ReactBaseModel<{
  message: string;
  count: number;
}> {
  getInitState(): { message: string; count: number } {
    return { message: "hello joy", count: 0 };
  }

  async add(num: number) {
    this.setState({ count: this.state.count + num });
  }
}
