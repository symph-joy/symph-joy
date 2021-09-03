import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route } from "@symph/react";
import { Autowire } from "@symph/core";
import { EntityModel } from "../model/entity.model";

@Route({ path: "/entities" })
@ReactController()
export default class HelloController extends ReactBaseController {
  @Autowire()
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
