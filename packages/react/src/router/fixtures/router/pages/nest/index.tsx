import React from "react";
import { ReactController, BaseReactController, ReactRoute } from "../../../../../index";

@ReactRoute({ path: "/nest", index: true })
@ReactController()
export default class NestIndex extends BaseReactController {
  renderView() {
    return <div data-testid="nestIndex">Nest Index</div>;
  }
}
