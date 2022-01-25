// server/controller/hello.controller.ts

import { Controller, Get } from "@symph/server";

@Controller()
export class HelloController {
  @Get("/hello")
  hello(): string {
    return "Hello Joy!";
  }
}
