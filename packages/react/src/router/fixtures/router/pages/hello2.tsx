import React from "react";
import { Controller, ReactController, Route } from "../../../../index";

@Route({ path: "/hello2" })
@Controller()
export default class Hello2 extends ReactController {
  renderView() {
    return (
      <div data-testid="hello2">
        <h2>hello2</h2>
      </div>
    );
  }
}
