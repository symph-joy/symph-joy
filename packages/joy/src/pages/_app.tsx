import React from "react";
import { RouteSwitch } from "@symph/react";

export default function App(props: any) {
  return (
    <div>
      <h1>App Container</h1>
      <RouteSwitch routes={props.routes} extraProps={{}} />
    </div>
  );
}
