import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { ReactDynamicLoad } from "@symph/joy/react";

@ReactDynamicLoad({ timeout: 3000, loading: "dynamicLoading" })
@ReactRoute({ path: "/dynamic-route/1" })
@ReactController()
export class DynamicRoutePage extends BaseReactController {
  renderView(): ReactNode {
    return <div id="dynamicRouteMsg">Hello dynamic load page 1.</div>;
  }
}
