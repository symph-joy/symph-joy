import React from "react";
import { ReactController, BaseReactController, ReactRoute } from "../../../../../../index";

@ReactRoute({ path: "/nest/child/abc" })
@ReactController()
export default class NestChildAbc extends BaseReactController {
  renderView() {
    return <div data-testid="nestChildAbc">Nest Child Abc</div>;
  }
}
