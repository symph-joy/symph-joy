// src/client/model/hello.model.ts

import { ReactModel, BaseReactModel } from "@symph/react";
import { Inject } from "@symph/core";
import { ReactFetchService } from "@symph/joy";

@ReactModel()
export class HelloModel extends BaseReactModel<{
  message: string;
}> {
  constructor(@Inject("joyFetchService") private joyFetchService: ReactFetchService) {
    super();
  }

  getInitState() {
    return { message: "Hello World!" }; // Init model state
  }

  async fetchMessage() {
    const resp = await this.joyFetchService.fetchApi("/hello");
    const message = await resp.text();
    this.setState({ message }); // Update model state
  }
}
