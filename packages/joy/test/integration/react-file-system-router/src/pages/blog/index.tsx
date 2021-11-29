import React from "react";
import { BaseReactController, ReactController } from "@symph/react";

if (typeof window !== "undefined") {
  window.onload = () => {
    console.log(">>>>> window.onload");
  };
}

@ReactController()
export default class Index extends BaseReactController {
  renderView() {
    return <div id="index">Blog Index</div>;
  }
}
