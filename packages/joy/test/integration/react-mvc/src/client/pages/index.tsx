import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { Prerender } from "@symph/joy/react";

@Prerender()
@ReactRoute({ path: "/links" })
@ReactController()
export default class IndexController extends BaseReactController {
  onClickLink = (link: string) => {
    this.props.navigate && this.props.navigate(link);
  };

  renderView(): ReactNode {
    return (
      <>
        <div id="basic-mvc" onClick={this.onClickLink.bind(this, "/react-mvc")}>
          /basic-mvc
        </div>
      </>
    );
  }
}
