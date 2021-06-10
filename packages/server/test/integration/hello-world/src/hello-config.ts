import { HelloController } from "./hello.controller";
import { Configuration } from "@symph/core";
import { HelloService } from "./hello.service";

@Configuration()
export class HelloConfig {
  @Configuration.Provider()
  helloController: HelloController;

  @Configuration.Provider()
  helloService: HelloService;
}
