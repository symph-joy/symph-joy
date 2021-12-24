import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { Inject } from "@symph/core";
import { EntityModel } from "../model/entity.model";

@ReactRoute({ path: "/entities" })
@ReactController()
export default class HelloController extends BaseReactController {
  @Inject()
  public entityModel: EntityModel;

  async initialModelState(context: any): Promise<void> {
    await this.entityModel.getAllEntities();
  }

  renderView(): ReactNode {
    const entities = this.entityModel.state.entities;
    return (
      <div>
        {entities.map((entity) => {
          return (
            <div>
              <span>{entity.id}</span>:<span>{entity.msg}</span>
            </div>
          );
        })}
      </div>
    );
  }
}
