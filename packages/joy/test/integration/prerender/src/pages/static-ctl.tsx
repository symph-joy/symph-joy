import React, { ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/dist/build/prerender";

@Prerender()
@Route({ path: "/static" })
@Controller()
export default class StaticCtl extends ReactController {
  renderView(): ReactNode {
    return (
      <>
        <div id="message">this is a static route page</div>
        <div>timestamp:{new Date().getTime()}</div>
      </>
    );
  }
}
