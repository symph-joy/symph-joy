import React from "react";
import { Controller, ReactController, Autowire } from "@symph/tempo";
import { CalculateModel } from "../models/CalculateModel";
import "./CalculateController.css";

@Controller()
export class CalculateController extends ReactController<any, any> {
  @Autowire()
  public calculateModel: CalculateModel;

  renderView() {
    let { counter } = this.calculateModel.state;
    return (
      <div className="counter">
        <div>total: {counter}</div>
        <button onClick={() => this.calculateModel.add(1)}>add 1</button>
      </div>
    );
  }
}
