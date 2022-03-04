import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
// @ts-ignore
import importImg from "./logo.png";
import { Image, Prerender } from "@symph/joy/react";

@Prerender()
@ReactController()
export default class ImagesComponent extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div>Image Component</div>
        <Image id="compImg" src={importImg} />
      </>
    );
  }
}
