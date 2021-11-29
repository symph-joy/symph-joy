import React from "react";
import { ReactController, BaseReactController, Route } from "../../../../../index";

@Route({ path: "/nest/abc" })
@ReactController()
export default class NestAbc extends ReactBaseController {
  renderView() {
    return <div data-testid="nestAbc">Nest Abc</div>;
  }
}
