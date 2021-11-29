import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/react";

@Prerender()
@Route({ path: "/links", exact: true })
@ReactController()
export default class IndexController extends BaseReactController {
  onClickLink = (link: string) => {
    // @ts-ignore
    this.props.history.push(link);
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
