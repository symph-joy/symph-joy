import React, { Component, ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";
import { HelloModel } from "../models/HelloModel";
import { string } from "prop-types";
import { Inject } from "@symph/core";

@Route({ path: "/hello" })
@Controller()
export default class HelloController extends ReactController {
  @Inject(HelloModel)
  private helloModel: HelloModel;

  renderView(): ReactNode {
    const { status, count } = this.helloModel.state;
    return (
      <div>
        <h1>Hello-1</h1>
        <div data-testid="status">message: {status}</div>
        <div data-testid="count">total count: {count}</div>
        <button onClick={() => this.helloModel.add(1)}>add 1</button>
      </div>
    );
  }
}
