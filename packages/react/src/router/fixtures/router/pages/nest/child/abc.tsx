import React from "react";
import { ReactController, ReactBaseController, Route } from "../../../../../../index";

@Route({ path: "/nest/child/abc" })
@ReactController()
export default class NestChildAbc extends ReactBaseController {
  renderView() {
    return <div data-testid="nestChildAbc">Nest Child Abc</div>;
  }
}
