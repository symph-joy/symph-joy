import React from "react";
import { ReactController, BaseReactController, Route, RouteParam } from "../../../../index";

@Route({ path: "/catch-all/*" })
@ReactController()
export default class CatchAllPage extends BaseReactController {
  @RouteParam({ name: "*" })
  private message: string;

  renderView() {
    return (
      <div>
        <div>Dynamic Route Path</div>
        <div data-testid={"message"}>{this.message}</div>
      </div>
    );
  }
}
