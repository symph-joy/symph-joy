import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { Prerender } from "@symph/joy/react";

@Prerender()
@ReactRoute({ path: "/links" })
@ReactController()
export default class LinksCtl extends BaseReactController {
  onClickLink = (link: string) => {
    this.props.navigate(link);
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
        <div id="embed" onClick={this.onClickLink.bind(this, "/embed/parent/child")}>
          /embed/parent/child
        </div>
      </>
    );
  }
}
