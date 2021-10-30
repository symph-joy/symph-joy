import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import {Prerender} from '@symph/joy/react';

@Prerender()
@Route({ path: "/" })
@ReactController()
export default class IndexController extends ReactBaseController {
  renderView(): ReactNode {
    return (
      <div>
        <div id="msg">Hello Index!</div>
        <div>
          link to: <a onClick={() => (this.props.history as any).push("/hello")}>/hello</a>
        </div>
      </div>
    );
  }
}
