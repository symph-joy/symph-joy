import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/dist/build/prerender";

@Prerender()
@Route({ path: "/links", exact: true })
@ReactController()
export default class LinksCtl extends ReactBaseController {
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
        <div id="dynamic-hello1" onClick={this.onClickLink.bind(this, "/dynamic/hello1")}>
          /dynamic/hello1
        </div>
      </>
    );
  }
}
