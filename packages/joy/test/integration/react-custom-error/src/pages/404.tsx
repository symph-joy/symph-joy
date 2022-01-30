import React from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/404" })
@ReactController()
export default class My404Page extends BaseReactController {
  renderView() {
    return <div id={"title"}>Custom 404</div>;
  }
}
