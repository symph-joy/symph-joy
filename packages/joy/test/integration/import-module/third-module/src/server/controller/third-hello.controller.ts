import { Controller, Get } from "@symph/server";

@Controller()
export class ThirdHelloController {
  @Get("/third-hello")
  hello(): string {
    return "Hello third module";
  }
}
