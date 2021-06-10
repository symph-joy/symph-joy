import { Model, ReactModel } from "@symph/react";

@Model()
export class BasicReactModel extends ReactModel<{
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
