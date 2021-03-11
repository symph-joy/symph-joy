import React from "react";
import { HelloModel } from "../models/HelloModel";
import { Controller, ReactController, Route } from "@symph/react";
import { Inject } from "@symph/core";

@Route({ path: "/hello2" })
@Controller()
export default class HelloController2 extends ReactController {
  @Inject(HelloModel)
  private helloModel: HelloModel;

  renderView() {
    const { status, count } = this.helloModel.state;
    return (
      <div>
        <h1>Hello-2</h1>
        <div data-testid="status">ffffg message: {status}</div>
        <div data-testid="count">total count: {count}</div>
        <button onClick={() => this.helloModel.add(1)}>add 1</button>
      </div>
    );
  }
}
