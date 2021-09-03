import { ReactBaseModel, ReactModel } from "@symph/react";
import { JoyFetchService } from "@symph/joy";
import { Autowire } from "@symph/core";

interface Entity {
  id: number;
  msg: string;
}

@ReactModel()
export class EntityModel extends ReactBaseModel<{
  entities: Entity[];
  showEntity?: Entity;
}> {
  constructor(@Autowire("joyFetchService") public fetchService: JoyFetchService) {
    super();
  }

  getInitState() {
    return {
      entities: [],
    };
  }

  async getAllEntities(): Promise<void> {
    const data = await this.fetchService.fetch("/api/entities").then((res) => res.json());
    this.setState({
      entities: data,
    });
    return data;
  }

  async getEntity(id: number): Promise<void> {
    const data = await this.fetchService.fetch(`/api/entity/${id}`).then((res) => res.json());
    this.setState({
      showEntity: data,
    });
    return data;
  }
}
