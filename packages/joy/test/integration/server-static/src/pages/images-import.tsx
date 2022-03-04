import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
// @ts-ignore
import importImg from "./logo.png";
import { Prerender } from "@symph/joy/react";

const requireImg = require("./logo.png");

@Prerender()
@ReactController()
export default class ImagesImport extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div id="importImg">{JSON.stringify(importImg)}</div>
        <img id={"importImgSrc"} src={importImg.src} />
        <img id={"importImgBlur"} src={importImg.blurDataURL} />
        <div id="requireImg">{JSON.stringify(requireImg)}</div>
      </>
    );
  }
}
