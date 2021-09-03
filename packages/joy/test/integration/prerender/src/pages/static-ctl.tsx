import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/dist/build/prerender";

@Prerender()
@Route({ path: "/static" })
@ReactController()
export default class StaticCtl extends ReactBaseController {
  renderView(): ReactNode {
    return (
      <>
        <div>
          controller class name:<span id="ctlClassName">{StaticCtl.name}</span>
          constructor class name:<span id="constructorName">{this.constructor.name}</span>
        </div>
        <div id="message">this is a static route page</div>
        <div>timestamp:{new Date().getTime()}</div>
      </>
    );
  }
}
