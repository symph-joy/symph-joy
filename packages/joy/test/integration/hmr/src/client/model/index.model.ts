import { ReactModel, ReactBaseModel } from "@symph/react";
import { Autowire } from "@symph/core";
import { ReactFetchService } from "@symph/joy";

@ReactModel()
export class IndexModel extends ReactBaseModel<{
  message: string;
}> {
  constructor(@Autowire("joyFetchService") private joyFetchService: ReactFetchService) {
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
