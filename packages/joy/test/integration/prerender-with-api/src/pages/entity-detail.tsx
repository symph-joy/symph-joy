import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute, RouteParam } from "@symph/react";
import { EntityModel } from "../model/entity.model";
import { Inject, IApplicationContext } from "@symph/core";
import { Prerender, IJoyPrerender } from "@symph/joy/react";

@Prerender()
export class EntityPrerenderGenerator implements IJoyPrerender {
  constructor(private entityModel: EntityModel) {}

  getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
    return "/entity/:id";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    // return ["/entity/1", "/entity/2"];
    const entities = await this.entityModel.getAllEntities();
    const paths = entities.map((entity) => `/entity/${entity.id}`);
    return paths;
  }
}

@ReactRoute({ path: "/entity/:id" })
@ReactController()
export default class EntityDetail extends BaseReactController {
  @RouteParam()
  private id: number;

  @Inject()
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
