import { Configuration } from "@symph/core";
import { ThirdHelloController } from "./controller/third-hello.controller";

@Configuration()
export class ThirdServerApplicationConfiguration {
  @Configuration.Component()
  public thirdHelloController: ThirdHelloController;
}
