import React from "react";
import type { ImageConfig } from "../../joy-server/server/image/image-config";
import { imageConfigDefault } from "../../joy-server/server/image/image-config";

export const ImageConfigContext = React.createContext<ImageConfig>(imageConfigDefault);

if (process.env.NODE_ENV !== "production") {
  ImageConfigContext.displayName = "ImageConfigContext";
}
