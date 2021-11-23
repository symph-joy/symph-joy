import { Controller, Get } from "@symph/server";
import { Configurable, ConfigValue } from "@symph/config";

@Configurable()
@Controller()
export class HelloController {
  @ConfigValue()
  public msg: string;

  @Get("/hello")
  hello(): string {
    return this.msg;
  }
}
