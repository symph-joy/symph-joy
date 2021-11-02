import React from "react";
import { ReactBaseController, ReactController, RouteParam } from "@symph/react";

@ReactController()
export default class Id extends ReactBaseController {
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
