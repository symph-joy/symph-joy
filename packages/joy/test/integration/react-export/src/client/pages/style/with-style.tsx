import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Prerender } from "@symph/joy/react";
import styles from "./with-style.less";

@Prerender()
@ReactController()
export default class WithStyle extends BaseReactController {
  renderView(): ReactNode {
    return (
      <div>
        <div id="msg" className={styles.message}>
          hello with style route
        </div>
      </div>
    );
  }
}
