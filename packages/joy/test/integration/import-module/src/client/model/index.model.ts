import { ReactBaseModel, ReactModel } from "@symph/react";
import { JoyFetchService } from "@symph/joy/dist/index-client";
import { Autowire } from "@symph/core";

@ReactModel()
export class IndexModel extends ReactBaseModel<{
  message: string;
}> {
  constructor(@Autowire("joyFetchService") private joyFetchService: JoyFetchService) {
    super();
  }

  getInitState(): { message: string } {
    return { message: "" };
  }

  async fetchMessage() {
    const resp = await this.joyFetchService.fetchApi("/hello");
    const message = await resp.text();
    this.setState({ message });
  }
}
