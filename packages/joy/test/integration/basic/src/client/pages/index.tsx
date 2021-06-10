import React, { ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";
import { Prerender } from "@symph/joy/dist/build/prerender";

@Prerender()
@Route({ path: "/links", exact: true })
@Controller()
export default class IndexController extends ReactController {
  onClickLink = (link: string) => {
    // @ts-ignore
    this.props.history.push(link);
  };

  renderView(): ReactNode {
    return (
      <>
        <div id="basic-mvc" onClick={this.onClickLink.bind(this, "/basic-mvc")}>
          /basic-mvc
        </div>
      </>
    );
  }
}
