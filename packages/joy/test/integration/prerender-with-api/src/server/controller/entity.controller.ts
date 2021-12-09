import { Controller, Get, Param } from "@symph/server";

interface Entity {
  id: string;
  msg: string;
}

@Controller()
export class EntityController {
  @Get("/entities")
  getEntities(): Entity[] {
    return [
      {
        id: "1",
        msg: "Hello 1.",
      },
      {
        id: "2",
        msg: "Hello 2.",
      },
    ];
  }

  @Get("/entity/:id")
  getEntity(@Param("id") id: string): Entity {
    return {
      id,
      msg: `Hello ${id}.`,
    };
  }
}
