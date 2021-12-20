import { ReactModel, BaseReactModel } from "@symph/react";
import { Inject } from "@symph/core";
import { ReactFetchService } from "@symph/joy";

@ReactModel()
export class IndexModel extends BaseReactModel<{
  message: string;
}> {
  constructor(@Inject("joyFetchService") private joyFetchService: ReactFetchService) {
    super();
  }

  getInitState(): { message: string } {
    return { message: "init message" };
  }

  async fetchMessage() {
    const resp = await this.joyFetchService.fetchApi("/hello");
    const message = await resp.text();
    this.setState({ message });
  }
}
