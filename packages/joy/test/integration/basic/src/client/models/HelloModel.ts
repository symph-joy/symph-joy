import { Model, ReactModel } from "@symph/react";

@Model()
export class HelloModel extends ReactModel<{ status: string; count: number }> {
  getInitState(): { status: string; count: number } {
    return { status: "hello joyddvdd", count: 1 };
  }

  add(num: number) {
    this.setState({ count: this.state.count + num });
  }
}
