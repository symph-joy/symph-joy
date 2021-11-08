import React, { ReactNode } from "react";
import { ReactBaseController, ReactController } from "@symph/react";


import variables from "./index-sass-variables.scss";

@ReactController()
export default class ModulesController extends ReactBaseController {
  renderView(): ReactNode {
    return (
      <div>
        <div id={"sassVariable"} style={{color: variables.primaryColor}}>
          Sass variables
        </div>
      </div>
    );
  }
}
