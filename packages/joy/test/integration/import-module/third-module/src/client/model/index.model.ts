import { Model, ReactModel } from "@symph/react";
import { JoyFetchService } from "@symph/joy/dist/index-client";
import { Inject } from "@symph/core";

@Model()
export class IndexModel extends ReactModel<{
  message: string;
}> {
  constructor(@Inject("joyFetchService") private joyFetchService: JoyFetchService) {
    super();
  }

  getInitState(): { message: string } {
    return { message: "aaaa" };
  }

  async fetchMessage() {
    const resp = await this.joyFetchService.fetch("/api/third/hello");
    const message = await resp.text();
    this.setState({ message });
  }
}
