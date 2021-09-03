import { ReactBaseModel, ReactModel } from "@symph/react";
import { JoyFetchService } from "@symph/joy/dist/index-client";
import { Autowire } from "@symph/core";

@ReactModel()
export class ThirdModel extends ReactBaseModel<{
  message: string;
}> {
  constructor(@Autowire("joyFetchService") private joyFetchService: JoyFetchService) {
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
