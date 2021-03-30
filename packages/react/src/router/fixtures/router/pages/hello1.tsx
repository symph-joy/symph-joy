import React from "react";
import { Controller, ReactController, Route } from "../../../../index";

@Route({ path: "/hello1" })
@Controller()
export default class Hello1 extends ReactController {
  renderView() {
    return (
      <div data-testid="hello1">
        <h2>hello1</h2>
      </div>
    );
  }
}
