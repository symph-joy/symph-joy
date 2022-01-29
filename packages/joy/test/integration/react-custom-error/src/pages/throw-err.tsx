import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/throw-err" })
@ReactController()
export default class ThrowErrController extends BaseReactController {
  renderView(): ReactNode {
    throw new Error("Throw MyError");
  }
}
