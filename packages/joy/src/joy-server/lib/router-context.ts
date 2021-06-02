import React from "react";
import { JoyRouter } from "./router/router";

export const RouterContext = React.createContext<JoyRouter>(null as any);

if (process.env.NODE_ENV !== "production") {
  RouterContext.displayName = "RouterContext";
}
