import React, { ReactNode } from "react";
import { ReactController, BaseReactController, ReactRoute } from "@symph/react";
import { Inject } from "@symph/core";
import { BasicReactView } from "./basic-react-view";
import { BasicReactModel } from "./basic-react.model";

@ReactRoute({ path: "/react-mvc" })
@ReactController()
export default class BasicReactController extends BaseReactController {
  @Inject()
  private helloModel: BasicReactModel;

  async initModelStaticState(): Promise<void> {
    console.log("initModelStaticState");
    await this.helloModel.add(1);
  }

  onInitialModelStaticStateDid() {
    console.log("onInitialModelStaticStateDid");
    this.helloModel.add(2);
  }

  renderView(): ReactNode {
    const { message, count } = this.helloModel.state;
    return (
      <div>
        <h1>Hello-12</h1>
        <BasicReactView message={message} count={count} />
        <button id={"btnAdd"} onClick={() => this.helloModel.add(3)}>
          add 3
        </button>
      </div>
    );
  }
}
