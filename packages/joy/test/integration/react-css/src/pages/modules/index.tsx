import React, { ReactNode } from "react";
import { ReactBaseController, ReactController } from "@symph/react";

import cssStyles from "./index-css.module.css";
import lessStyles from "./index-less.module.less";
import scssStyles from "./index-scss.module.scss";
import sassStyles from "./index-sass.module.sass";

@ReactController()
export default class ModulesController extends ReactBaseController {
  renderView(): ReactNode {
    return (
      <div>
        <div id={"cssStyle"} className={cssStyles.cssStyle}>
          Css style
        </div>
        <div id={"lessStyle"} className={lessStyles.lessStyle}>
          Less style
        </div>
        <div id={"scssStyle"} className={scssStyles.scssStyle}>
          Scss style
        </div>
        <div id={"sassStyle"} className={sassStyles.sassStyle}>
          Sass style
        </div>
      </div>
    );
  }
}
