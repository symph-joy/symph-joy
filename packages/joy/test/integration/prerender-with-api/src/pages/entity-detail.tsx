import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route, RouteParam } from "@symph/react";
import { EntityModel } from "../model/entity.model";
import { Autowire, ICoreContext } from "@symph/core";
import { Prerender, JoyPrerenderInterface } from "@symph/joy/react";

@Prerender()
export class EntityPrerenderGenerator implements JoyPrerenderInterface {
  getRoute(): string | ReactBaseController<Record<string, unknown>, Record<string, unknown>, ICoreContext> {
    return "/entity/:id";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string | { params: { id: string } }>> {
    return ["/entity/1", "/entity/2"];
  }
}

@Route({ path: "/entity/:id" })
@ReactController()
export default class EntityDetail extends ReactBaseController {
  @RouteParam()
  private id: number;

  @Autowire()
  public entityModel: EntityModel;

  async initialModelStaticState(urlParams: any): Promise<void | number> {
    await this.entityModel.getEntity(this.id);
  }

  renderView(): ReactNode {
    const entity = this.entityModel.state.showEntity;
    if (!entity) {
      return <div>entity loading</div>;
    }
    const { id, msg } = entity;
    return (
      <div>
        <div id="id">{id}</div>
        <div id="msg">{msg}</div>
      </div>
    );
  }
}
