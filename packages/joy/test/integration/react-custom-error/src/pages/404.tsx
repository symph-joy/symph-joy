import React from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/404" })
@ReactController()
export default class MyError extends BaseReactController {
  renderView() {
    return (
      <div>
        <div id={"title"}>Custom 404</div>
      </div>
    );
  }
}
