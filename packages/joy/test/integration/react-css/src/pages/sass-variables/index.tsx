import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";

import variables from "./index-sass-variables.scss";

@ReactController()
export default class ModulesController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id={"sassVariable"} style={{ color: variables.primaryColor }}>
          Sass variables
        </div>
      </div>
    );
  }
}
