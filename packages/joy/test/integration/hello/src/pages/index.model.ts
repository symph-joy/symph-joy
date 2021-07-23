import { Model, ReactModel } from "@symph/react";
import { JoyFetchService } from "@symph/joy";
import { Inject } from "@symph/core";

@Model()
export class IndexModel extends ReactModel<{
  message: string;
}> {
  constructor(
    @Inject("joyFetchService") private joyFetchService: JoyFetchService
  ) {
    super();
  }

  getInitState(): { message: string } {
    return { message: "aaa" };
  }

  async fetchMessage() {
    const resp = await this.joyFetchService.fetch("/api/hello");
    const message = await resp.text();
    this.setState({ message });
  }
}
