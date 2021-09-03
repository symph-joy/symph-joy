import { Configuration } from "@symph/core";
import { HelloController } from "./controller/hello.controller";

@Configuration()
export class ThirdServerApplicationConfiguration {
  @Configuration.Provider()
  public helloController: HelloController;
}
