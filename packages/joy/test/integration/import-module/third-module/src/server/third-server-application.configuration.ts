import { Configuration } from "@symph/core";
import { ThirdHelloController } from "./controller/third-hello.controller";

@Configuration()
export class ThirdServerApplicationConfiguration {
  @Configuration.Provider()
  public thirdHelloController: ThirdHelloController;
}
