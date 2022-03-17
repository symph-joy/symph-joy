import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRouteContainer } from "@symph/react";
import { Outlet } from "react-router-dom";
import { LoadableLoadingComponentProps } from "@symph/joy/react";

@ReactRouteContainer({ path: "/dynamic-route" })
@ReactController()
export class DynamicRouteIndexPage extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <h1>Dynamic Load Page Container</h1>
        <Outlet />
      </>
    );
  }
}

@ReactController()
export class DynamicLoading extends BaseReactController<LoadableLoadingComponentProps> {
  renderView(): ReactNode {
    return (
      <>
        <div id="loadingMsg">Custom loading...</div>
      </>
    );
  }
}
