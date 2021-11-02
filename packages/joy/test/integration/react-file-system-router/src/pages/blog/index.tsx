import React from "react";
import { ReactBaseController, ReactController } from "@symph/react";

if (typeof window !== "undefined") {
  window.onload = () => {
    console.log(">>>>> window.onload");
  };
}

@ReactController()
export default class Index extends ReactBaseController {
  renderView() {
    return <div id="index">Blog Index</div>;
  }
}
