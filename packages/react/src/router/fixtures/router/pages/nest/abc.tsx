import React from "react";
import { ReactController, BaseReactController, ReactRoute } from "../../../../../index";

@ReactRoute({ path: "/nest/abc" })
@ReactController()
export default class NestAbc extends BaseReactController {
  renderView() {
    return <div data-testid="nestAbc">Nest Abc</div>;
  }
}
