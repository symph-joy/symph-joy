import React from "react";
import { ReactController, BaseReactController, Route } from "../../../../../../index";

@Route({ path: "/nest/child/abc" })
@ReactController()
export default class NestChildAbc extends BaseReactController {
  renderView() {
    return <div data-testid="nestChildAbc">Nest Child Abc</div>;
  }
}
