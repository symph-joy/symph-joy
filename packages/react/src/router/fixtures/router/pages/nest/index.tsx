import React from "react";
import { ReactController, ReactBaseController, Route } from "../../../../../index";

@Route({ path: "/nest/index" })
@ReactController()
export default class NestIndex extends ReactBaseController {
  renderView() {
    return <div data-testid="nestIndex">Nest Index</div>;
  }
}
