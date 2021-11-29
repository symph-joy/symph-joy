import React from "react";
import { BaseReactController, ReactController, RouteParam } from "@symph/react";

@ReactController()
export default class Id extends BaseReactController {
  @RouteParam()
  private id: string;

  renderView() {
    return (
      <div>
        <div id="postTitle">{`Post ${this.id}`}</div>
        <div id="postComments">Post Comments</div>
      </div>
    );
  }
}
