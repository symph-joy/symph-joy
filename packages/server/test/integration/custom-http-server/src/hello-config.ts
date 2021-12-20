import { HelloController } from "./hello.controller";
import { Configuration } from "@symph/core";

@Configuration()
export class HelloConfig {
  @Configuration.Component()
  helloController: HelloController;
}
