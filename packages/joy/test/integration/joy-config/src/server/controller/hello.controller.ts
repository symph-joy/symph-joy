import { Controller, Get } from "@symph/server";
import { Value } from "@symph/config";

@Controller()
export class HelloController {
  @Value()
  public msg: string;

  @Get("/hello")
  hello(): string {
    return this.msg;
  }
}
