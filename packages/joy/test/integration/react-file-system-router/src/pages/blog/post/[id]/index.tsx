import React from "react";
import { BaseReactController, ReactController, RouteParam } from "@symph/react";

@ReactController()
export default class Id extends BaseReactController {
  @RouteParam()
  private id: string;

  renderView() {
    return <div id="post">{`Post ${this.id}`}</div>;
  }
}
