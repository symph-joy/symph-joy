import { BaseReactModel, ReactModel } from "@symph/react";
import { ReactFetchService } from "@symph/joy";
import { Inject } from "@symph/core";

interface Entity {
  id: string;
  msg: string;
}

@ReactModel()
export class EntityModel extends BaseReactModel<{
  entities: Entity[];
  showEntity?: Entity;
}> {
  constructor(@Inject("joyFetchService") public fetchService: ReactFetchService) {
    super();
  }

  getInitState() {
    return {
      entities: [],
    };
  }

  async getAllEntities(): Promise<Entity[]> {
    const data = await this.fetchService.fetch("/entities").then((res) => res.json());
    this.setState({
      entities: data,
    });
    return data;
  }

  async getEntity(id: number): Promise<Entity> {
    const data = await this.fetchService.fetch(`/entity/${id}`).then((res) => res.json());
    this.setState({
      showEntity: data,
    });
    return data;
  }
}
