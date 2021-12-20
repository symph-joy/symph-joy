import { BaseReactModel, ReactModel } from "@symph/react";
import { Inject } from "@symph/core";
import { ReactFetchService } from "@symph/joy";

@ReactModel()
export class HelloModel extends BaseReactModel<{
  message: string;
}> {
  constructor(@Inject("joyFetchService") private fetchService: ReactFetchService) {
    super();
  }
  getInitState(): { message: string } {
    return { message: "hello from model" };
  }

  async fetchMessage() {
    const resp = await this.fetchService.fetchApi("/hello");
    const message = await resp.text();
    this.setState({ message });
  }
}
