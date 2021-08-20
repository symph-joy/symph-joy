import { ReactModel, ReactBaseModel } from "@symph/react";
import { JoyFetchService } from "@symph/joy";
import { Autowire } from "@symph/core";

@ReactModel()
export class IndexModel extends ReactBaseModel<{
  message: string;
}> {
  constructor(@Autowire("joyFetchService") private joyFetchService: JoyFetchService) {
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
