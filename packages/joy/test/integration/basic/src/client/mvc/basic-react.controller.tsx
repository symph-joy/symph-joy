import React, { ReactNode } from "react";
import { ReactController, ReactBaseController, Route } from "@symph/react";
import { Autowire } from "@symph/core";
import { BasicReactView } from "./basic-react-view";
import { BasicReactModel } from "./basic-react.model";

@Route({ path: "/basic-mvc" })
@ReactController()
export default class BasicReactController extends ReactBaseController {
  @Autowire()
  private helloModel: BasicReactModel;

  async initialModelState(context: any): Promise<void> {
    await this.helloModel.add(1);
  }

  renderView(): ReactNode {
    const { message, count } = this.helloModel.state;
    return (
      <div>
        <h1>Hello-1</h1>
        <BasicReactView message={message} count={count} />
        <button id={"btnAdd"} onClick={() => this.helloModel.add(1)}>
          add 1 sd
        </button>
      </div>
    );
  }
}
