import { Controller, Get, Param } from "@symph/server";

interface Entity {
  id: number;
  msg: string;
}

@Controller()
export class EntityController {
  @Get("/api/entities")
  getEntities(): Entity[] {
    return [
      {
        id: 1,
        msg: "Hello 1.",
      },
      {
        id: 2,
        msg: "Hello 2.",
      },
    ];
  }

  @Get("/api/entity/:id")
  getEntity(@Param("id") id: number): Entity {
    return {
      id,
      msg: `Hello ${id}.`,
    };
  }
}
