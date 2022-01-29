import React from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Outlet } from "@symph/react/router-dom";

@ReactController()
export default class MainLayout extends BaseReactController {
  renderView(): React.ReactNode {
    return (
      <div>
        <div>Main Layout</div>
        <Outlet />
      </div>
    );
  }
}
