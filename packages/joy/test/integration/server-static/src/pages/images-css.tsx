import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
// @ts-ignore
import styles from "./images-css.css";
import { Prerender } from "@symph/joy/react";

@Prerender()
@ReactController()
export default class ImagesCss extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div id="imgCSS" className={styles.imgCSS}></div>
      </>
    );
  }
}
