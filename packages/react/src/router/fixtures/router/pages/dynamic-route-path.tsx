import React from "react";
import { ReactController, BaseReactController, ReactRoute, RouteParam } from "../../../../index";

@ReactRoute({ path: "/dynamic/:message/:count" })
@ReactController()
export default class DynamicRoutePath extends BaseReactController {
  @RouteParam()
  private message: string;

  @RouteParam()
  private count: number;

  @RouteParam({ name: "count" })
  private hasCount: boolean;

  @RouteParam({
    name: "count",
    transform: (str) => new Number(str).valueOf() + 1,
  })
  private countTrans: number;

  renderView() {
    return (
      <div>
        <div>Dynamic Route Path</div>
        <div data-testid={"message"}>{this.message}</div>
        <div data-testid={"count"}>{this.count}</div>
        <div data-testid={"hasCount"}>{this.hasCount + ""}</div>
        <div data-testid={"countTrans"}>{this.countTrans}</div>
      </div>
    );
  }
}
