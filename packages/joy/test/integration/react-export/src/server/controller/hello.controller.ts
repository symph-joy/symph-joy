import { Controller, Get } from "@symph/server";
import { Value } from "@symph/config";

@Controller()
export class HelloController {
  @Get("/hello")
  hello(): string {
    return "hello from api";
  }
}
