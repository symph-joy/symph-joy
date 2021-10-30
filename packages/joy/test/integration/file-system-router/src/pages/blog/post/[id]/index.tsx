import React from "react";
import { ReactBaseController, ReactController, RouteParam } from "@symph/react";

@ReactController()
export default class Id extends ReactBaseController {
  @RouteParam()
  private id: string;

  renderView() {
    return <div id="post">{`Post ${this.id}`}</div>;
  }
}
