import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
// @ts-ignore
import importImg from "./logo.png";
import { Prerender } from "@symph/joy/react";

function getImageUrl(src: string, width: number, quality = 75) {
  return `/_joy/image/?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}

@Prerender()
@ReactController()
export default class ImagesOptimizer extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div>Image Optimizer</div>
        <img id="size8" src={getImageUrl(importImg.src, 8)} />
        <img id="size32" src={getImageUrl(importImg.src, 32)} />
        <img id="size256" src={getImageUrl(importImg.src, 256)} />
      </>
    );
  }
}
