import React, { ReactNode } from "react";
import { ReactController, BaseReactController, ReactRoute, ReactRouteContainer } from "@symph/react";

import dynamic from "@symph/joy/dynamic";
const DynamicLoadThirdModule = dynamic(() => import("./component/third-module"));

@ReactRouteContainer({ path: "/dynamic-module" })
@ReactController()
export default class DynamicModuleIndexPage extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <h1>Dynamic Load Module Page</h1>
        <DynamicLoadThirdModule />
      </>
    );
  }
}
