import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";

import "./index-css.global.css";
import "./index-less.global.less";
import "./index-scss.global.scss";
import "./index-sass.global.sass";

@ReactController()
export default class GlobalController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id={"cssStyle"} className={"cssStyle"}>
          Css style
        </div>
        <div id={"lessStyle"} className={"lessStyle"}>
          Less style
        </div>
        <div id={"scssStyle"} className={"scssStyle"}>
          Scss style
        </div>
        <div id={"sassStyle"} className={"sassStyle"}>
          Sass style
        </div>
      </div>
    );
  }
}
