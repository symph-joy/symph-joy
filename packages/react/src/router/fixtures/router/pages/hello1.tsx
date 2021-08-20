import React from "react";
import { ReactController, ReactBaseController, Route } from "../../../../index";

@Route({ path: "/hello1" })
@ReactController()
export default class Hello1 extends ReactBaseController {
  renderView() {
    return (
      <div data-testid="hello1">
        <h2>hello1</h2>
      </div>
    );
  }
}
