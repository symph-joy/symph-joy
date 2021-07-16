import { Controller, Get } from "@symph/server";

@Controller()
export class HelloController {
  @Get("/api/hello")
  hello(): string {
    return "Hello world!";
  }
}
