import React from "react";
import { ReactController, ReactBaseController, Route } from "../../../../index";

@Route({ path: "/hello2" })
@ReactController()
export default class Hello2 extends ReactController {
  renderView() {
    return (
      <div data-testid="hello2">
        <h2>hello2</h2>
      </div>
    );
  }
}
