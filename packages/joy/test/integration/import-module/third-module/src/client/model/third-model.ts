import { BaseReactModel, ReactModel } from "@symph/react";
import { Autowire } from "@symph/core";
import { ThirdFetchService } from "../service/third-fetch.service";

@ReactModel()
export class ThirdModel extends BaseReactModel<{
  message: string;
}> {
  constructor(@Autowire("thirdFetchService") private fetchService: ThirdFetchService) {
    super();
  }

  getInitState(): { message: string } {
    return { message: "Third init message." };
  }

  async fetchMessage() {
    // const resp = await this.fetchService.fetchModuleApi("/third-hello", 'mount');
    const resp = await this.fetchService.fetchModuleApi("/third-hello");
    const message = await resp.text();
    this.setState({ message });
  }
}
