import { Configuration } from "@symph/core";
import { ReactRouter } from "@symph/react";
import { ReactContextFactory } from "./react-context-factory";

@Configuration()
export class JoyReactConfiguration {
  @Configuration.Provider()
  public joyReactRouter: ReactRouter;

  @Configuration.Provider()
  public reactContextFactory: ReactContextFactory;
}
