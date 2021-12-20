import { BaseReactModel, ReactModel } from "@symph/react";
import { ReactFetchService } from "@symph/joy/dist/index-client";
import { Inject } from "@symph/core";

@ReactModel()
export class IndexModel extends BaseReactModel<{
  message: string;
}> {
  constructor(@Inject("joyFetchService") private joyFetchService: ReactFetchService) {
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
