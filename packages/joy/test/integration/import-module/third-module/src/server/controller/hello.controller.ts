import { Controller, Get } from "@symph/server";

@Controller()
export class HelloController {
  @Get("/api/third/hello")
  hello(): string {
    return "Hello third module";
  }
}
