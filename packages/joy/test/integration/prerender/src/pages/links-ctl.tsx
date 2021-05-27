import React, { ReactNode } from "react";
import {
  Controller,
  Model,
  ReactController,
  ReactModel,
  Route,
} from "@symph/react";
import { Prerender } from "@symph/joy/dist/build/prerender";

@Prerender()
@Route({ path: "/links", exact: true })
@Controller()
export default class LinksCtl extends ReactController {
  onClickLink = (link: string) => {
    // @ts-ignore
    this.props.history.push(link);
  };

  renderView(): ReactNode {
    return (
      <>
        <div id="stateful" onClick={this.onClickLink.bind(this, "/stateful")}>
          /stateful
        </div>
        <div
          id="dynamic-hello1"
          onClick={this.onClickLink.bind(this, "/dynamic/hello1")}
        >
          /dynamic/hello1
        </div>
      </>
    );
  }
}
